const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../database/pool');

router.get('/', auth, async (req, res) => {
  try {
    const now   = new Date();
    const mois  = parseInt(req.query.mois,  10) || (now.getMonth() + 1);
    const annee = parseInt(req.query.annee, 10) || now.getFullYear();
    const rows = await db.queryAll(`
      SELECT p.*, l.nom as locataire_nom, b.nom as bien_nom, b.quartier
      FROM paiements p
      JOIN locataires l ON l.id = p.locataire_id
      JOIN biens b      ON b.id = p.bien_id
      WHERE p.mois=$1 AND p.annee=$2
      ORDER BY p.created_at DESC
    `, [mois, annee]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { locataire_id, bien_id, montant, date_paiement, mode, statut, mois, annee, notes } = req.body;
    if (!locataire_id || !montant)
      return res.status(400).json({ error: 'locataire_id et montant requis' });

    const now = new Date();
    const m   = mois  || now.getMonth() + 1;
    const a   = annee || now.getFullYear();

    const doublon = await db.queryOne(
      'SELECT id FROM paiements WHERE locataire_id=$1 AND mois=$2 AND annee=$3',
      [locataire_id, m, a]
    );
    if (doublon) return res.status(409).json({
      error: `Un paiement existe déjà pour ce locataire en ${m}/${a}.`,
      existing_id: doublon.id,
    });

    const bId = bien_id || (await db.queryOne('SELECT bien_id FROM locataires WHERE id=$1', [locataire_id]))?.bien_id;
    const r = await db.query(`
      INSERT INTO paiements (locataire_id,bien_id,montant,date_paiement,mode,statut,mois,annee,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [locataire_id, bId, montant, date_paiement||null, mode||'Espèces', statut||'paye', m, a, notes||null]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { montant, date_paiement, mode, statut, notes } = req.body;
    const r = await db.query(`
      UPDATE paiements SET montant=$1,date_paiement=$2,mode=$3,statut=$4,notes=$5
      WHERE id=$6 RETURNING *
    `, [montant, date_paiement, mode, statut, notes, req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM paiements WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/paiements/generer?mois=5&annee=2026
router.post('/generer', auth, async (req, res) => {
  try {
    const now   = new Date();
    const mois  = parseInt(req.query.mois,  10) || (now.getMonth() + 1);
    const annee = parseInt(req.query.annee, 10) || now.getFullYear();

    const locataires = await db.queryAll(`
      SELECT l.id, l.nom, l.bien_id, b.loyer
      FROM locataires l JOIN biens b ON b.id = l.bien_id
      WHERE l.bien_id IS NOT NULL AND b.statut='occupe'
    `);

    let crees = 0, deja = 0;
    for (const loc of locataires) {
      const existe = await db.queryOne(
        'SELECT id FROM paiements WHERE locataire_id=$1 AND mois=$2 AND annee=$3',
        [loc.id, mois, annee]
      );
      if (!existe) {
        await db.query(
          "INSERT INTO paiements (locataire_id,bien_id,montant,statut,mois,annee) VALUES ($1,$2,$3,'en_attente',$4,$5)",
          [loc.id, loc.bien_id, loc.loyer, mois, annee]
        );
        crees++;
      } else { deja++; }
    }
    res.json({ message: `${crees} créé(s), ${deja} déjà existant(s).`, crees, deja, mois, annee });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;
