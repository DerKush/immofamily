const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../database/pool');

function statutImmeuble(unites) {
  if (!unites.length) return 'vacant';
  const occupes = unites.filter(u => u.statut === 'occupe').length;
  if (occupes === unites.length) return 'occupe';
  if (occupes === 0) return 'vacant';
  return 'partiel';
}

// GET /api/biens
router.get('/', auth, async (req, res) => {
  try {
    const { quartier, statut, q } = req.query;
    let sql = `
      SELECT b.*,
        (SELECT l.nom FROM locataires l WHERE l.bien_id = b.id LIMIT 1) as locataire_nom
      FROM biens b WHERE b.parent_id IS NULL
    `;
    const params = [];
    let i = 1;
    if (quartier)              { sql += ` AND b.quartier = $${i++}`;  params.push(quartier); }
    if (statut && statut !== 'partiel') { sql += ` AND b.statut = $${i++}`; params.push(statut); }
    if (q) {
      sql += ` AND (b.nom ILIKE $${i} OR b.quartier ILIKE $${i+1} OR b.type ILIKE $${i+2} OR b.adresse ILIKE $${i+3})`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += ' ORDER BY b.created_at DESC';

    const biens = await db.queryAll(sql, params);

    const result = await Promise.all(biens.map(async (b) => {
      if (b.type !== 'Immeuble') return b;
      const unites = await db.queryAll(`
        SELECT u.*,
          (SELECT l.nom FROM locataires l WHERE l.bien_id = u.id LIMIT 1) as locataire_nom
        FROM biens u WHERE u.parent_id = $1 ORDER BY u.nom ASC
      `, [b.id]);
      return {
        ...b,
        statut:        statutImmeuble(unites),
        revenuMensuel: unites.reduce((s, u) => s + (Number(u.loyer) || 0), 0),
        nbOccupes:     unites.filter(u => u.statut === 'occupe').length,
        nbUnites:      unites.length,
        unites,
      };
    }));

    res.json(statut === 'partiel' ? result.filter(b => b.statut === 'partiel') : result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/biens/immeubles/liste
router.get('/immeubles/liste', auth, async (req, res) => {
  try {
    const r = await db.queryAll(
      "SELECT id,nom,quartier,adresse FROM biens WHERE type='Immeuble' AND parent_id IS NULL ORDER BY nom ASC"
    );
    res.json(r);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/biens/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const bien = await db.queryOne(`
      SELECT b.*, l.id as loc_id, l.nom as locataire_nom
      FROM biens b LEFT JOIN locataires l ON l.bien_id = b.id WHERE b.id = $1
    `, [req.params.id]);
    if (!bien) return res.status(404).json({ error: 'Bien non trouvé' });
    if (bien.type === 'Immeuble') {
      bien.unites = await db.queryAll(`
        SELECT u.*,
          (SELECT l.nom FROM locataires l WHERE l.bien_id = u.id LIMIT 1) as locataire_nom
        FROM biens u WHERE u.parent_id = $1 ORDER BY u.nom ASC
      `, [req.params.id]);
    }
    res.json(bien);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/biens
router.post('/', auth, async (req, res) => {
  try {
    const { nom, quartier, type, superficie, loyer, statut, latitude, longitude, description, parent_id, adresse } = req.body;
    if (!nom || !quartier) return res.status(400).json({ error: 'Nom et quartier obligatoires.' });
    const loyerVal = type === 'Immeuble' ? 0 : (Number(loyer) || 0);
    const r = await db.query(`
      INSERT INTO biens (nom,quartier,type,superficie,loyer,statut,latitude,longitude,description,parent_id,adresse)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [nom, quartier, type||'Appartement', superficie||null, loyerVal,
        statut||'vacant', latitude||null, longitude||null,
        description||null, parent_id||null, adresse||null]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// PUT /api/biens/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { nom, quartier, type, superficie, loyer, statut, latitude, longitude, description, parent_id, adresse } = req.body;
    const loyerVal = type === 'Immeuble' ? 0 : (Number(loyer) || 0);
    const r = await db.query(`
      UPDATE biens SET nom=$1,quartier=$2,type=$3,superficie=$4,loyer=$5,
        statut=$6,latitude=$7,longitude=$8,description=$9,parent_id=$10,adresse=$11
      WHERE id=$12 RETURNING *
    `, [nom, quartier, type, superficie||null, loyerVal,
        statut, latitude||null, longitude||null,
        description||null, parent_id||null, adresse||null, req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/biens/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.transaction(async (t) => {
      await t.query('UPDATE locataires SET bien_id=NULL WHERE bien_id IN (SELECT id FROM biens WHERE parent_id=$1)', [req.params.id]);
      await t.query('DELETE FROM biens WHERE parent_id=$1', [req.params.id]);
      await t.query('UPDATE locataires SET bien_id=NULL WHERE bien_id=$1', [req.params.id]);
      await t.query('DELETE FROM biens WHERE id=$1', [req.params.id]);
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;
