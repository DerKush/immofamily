const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../database/pool');

router.get('/', auth, async (req, res) => {
  try {
    const now   = new Date();
    const mois  = parseInt(req.query.mois,  10) || (now.getMonth() + 1);
    const annee = parseInt(req.query.annee, 10) || now.getFullYear();
    const { q } = req.query;

    let sql = `
      SELECT l.*, b.nom as bien_nom, b.quartier, b.loyer,
        (SELECT p.statut FROM paiements p
         WHERE p.locataire_id = l.id AND p.mois = $1 AND p.annee = $2
         LIMIT 1) as statut_paiement
      FROM locataires l
      LEFT JOIN biens b ON b.id = l.bien_id
    `;
    const params = [mois, annee];
    let i = 3;

    if (q) {
      sql += ` WHERE (l.nom ILIKE $${i} OR b.nom ILIKE $${i+1} OR l.telephone ILIKE $${i+2})`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += ' ORDER BY l.created_at DESC';

    res.json(await db.queryAll(sql, params));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const loc = await db.queryOne(`
      SELECT l.*, b.nom as bien_nom, b.quartier, b.loyer
      FROM locataires l LEFT JOIN biens b ON b.id = l.bien_id WHERE l.id = $1
    `, [req.params.id]);
    if (!loc) return res.status(404).json({ error: 'Locataire non trouvé' });
    loc.paiements = await db.queryAll(
      'SELECT * FROM paiements WHERE locataire_id = $1 ORDER BY annee DESC, mois DESC LIMIT 12',
      [req.params.id]
    );
    res.json(loc);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { nom, email, telephone, bien_id, date_entree, date_echeance } = req.body;
    if (!nom) return res.status(400).json({ error: 'Le nom est obligatoire' });

    if (bien_id) {
      await db.query('UPDATE locataires SET bien_id=NULL WHERE bien_id=$1', [bien_id]);
      await db.query("UPDATE biens SET statut='occupe' WHERE id=$1", [bien_id]);
    }

    const r = await db.query(`
      INSERT INTO locataires (nom,email,telephone,bien_id,date_entree,date_echeance)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [nom, email||null, telephone||null, bien_id||null, date_entree||null, date_echeance||null]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { nom, email, telephone, bien_id, date_entree, date_echeance } = req.body;

    await db.transaction(async (t) => {
      const old = await t.queryOne('SELECT * FROM locataires WHERE id=$1', [req.params.id]);
      if (old?.bien_id && old.bien_id !== Number(bien_id)) {
        await t.query("UPDATE biens SET statut='vacant' WHERE id=$1", [old.bien_id]);
      }
      if (bien_id) {
        const occupant = await t.queryOne('SELECT id FROM locataires WHERE bien_id=$1 AND id!=$2', [bien_id, req.params.id]);
        if (occupant) await t.query('UPDATE locataires SET bien_id=NULL WHERE id=$1', [occupant.id]);
        await t.query("UPDATE biens SET statut='occupe' WHERE id=$1", [bien_id]);
      }
      await t.query(`
        UPDATE locataires SET nom=$1,email=$2,telephone=$3,bien_id=$4,date_entree=$5,date_echeance=$6
        WHERE id=$7
      `, [nom, email, telephone, bien_id||null, date_entree, date_echeance, req.params.id]);
    });

    res.json(await db.queryOne('SELECT * FROM locataires WHERE id=$1', [req.params.id]));
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const loc = await db.queryOne('SELECT * FROM locataires WHERE id=$1', [req.params.id]);
    if (loc?.bien_id) await db.query("UPDATE biens SET statut='vacant' WHERE id=$1", [loc.bien_id]);
    await db.query('DELETE FROM locataires WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;
