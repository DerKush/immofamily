const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../database/pool');

// ── MEMBRES ───────────────────────────────────────────────────────────────────

router.get('/membres', auth, async (req, res) => {
  try {
    res.json(await db.queryAll('SELECT * FROM membres ORDER BY ordre ASC'));
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/membres', auth, async (req, res) => {
  try {
    const { nom, initiales, couleur, role, part_pourcentage, ordre } = req.body;
    const r = await db.query(`
      INSERT INTO membres (nom, initiales, couleur, role, part_pourcentage, ordre)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [nom, initiales, couleur||'#4F46E5', role||'', part_pourcentage||25, ordre||99]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.put('/membres/:id', auth, async (req, res) => {
  try {
    const { nom, initiales, couleur, role, part_pourcentage, ordre } = req.body;
    const r = await db.query(`
      UPDATE membres SET nom=$1,initiales=$2,couleur=$3,role=$4,part_pourcentage=$5,ordre=$6
      WHERE id=$7 RETURNING *
    `, [nom, initiales, couleur, role, part_pourcentage, ordre, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.delete('/membres/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM membres WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── DÉPENSES ──────────────────────────────────────────────────────────────────

router.get('/depenses', auth, async (req, res) => {
  try {
    const now   = new Date();
    const mois  = parseInt(req.query.mois,  10) || now.getMonth() + 1;
    const annee = parseInt(req.query.annee, 10) || now.getFullYear();
    // Retourne les dépenses du mois + les récurrentes
    const rows = await db.queryAll(`
      SELECT * FROM depenses
      WHERE (mois=$1 AND annee=$2) OR recurrent=TRUE
      ORDER BY categorie, libelle
    `, [mois, annee]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.get('/depenses/categories', auth, async (req, res) => {
  try {
    res.json(await db.queryAll('SELECT * FROM categories_depenses ORDER BY nom'));
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/depenses', auth, async (req, res) => {
  try {
    const { libelle, montant, categorie, type, recurrent, mois, annee, bien_id, notes } = req.body;
    const now = new Date();
    const r = await db.query(`
      INSERT INTO depenses (libelle, montant, categorie, type, recurrent, mois, annee, bien_id, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [libelle, montant||0, categorie||'Autre', type||'fixe',
        recurrent||false, mois||now.getMonth()+1, annee||now.getFullYear(),
        bien_id||null, notes||null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.put('/depenses/:id', auth, async (req, res) => {
  try {
    const { libelle, montant, categorie, type, recurrent, mois, annee, notes } = req.body;
    const r = await db.query(`
      UPDATE depenses SET libelle=$1,montant=$2,categorie=$3,type=$4,
        recurrent=$5,mois=$6,annee=$7,notes=$8
      WHERE id=$9 RETURNING *
    `, [libelle, montant, categorie, type, recurrent, mois, annee, notes, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.delete('/depenses/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM depenses WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── RÉPARTITIONS ──────────────────────────────────────────────────────────────

router.get('/repartitions', auth, async (req, res) => {
  try {
    const now   = new Date();
    const mois  = parseInt(req.query.mois,  10) || now.getMonth() + 1;
    const annee = parseInt(req.query.annee, 10) || now.getFullYear();
    const rows  = await db.queryAll(`
      SELECT r.*, m.nom, m.initiales, m.couleur, m.role
      FROM repartitions r
      JOIN membres m ON m.id = r.membre_id
      WHERE r.mois=$1 AND r.annee=$2
      ORDER BY m.ordre
    `, [mois, annee]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// Génère / recalcule les répartitions pour le mois
router.post('/repartitions/generer', auth, async (req, res) => {
  try {
    const now       = new Date();
    const mois      = parseInt(req.query.mois,  10) || now.getMonth() + 1;
    const annee     = parseInt(req.query.annee, 10) || now.getFullYear();
    const { montant_total } = req.body;

    const membres = await db.queryAll('SELECT * FROM membres WHERE actif=TRUE ORDER BY ordre');
    const totalParts = membres.reduce((s, m) => s + Number(m.part_pourcentage), 0);

    // Supprimer les répartitions existantes
    await db.query('DELETE FROM repartitions WHERE mois=$1 AND annee=$2', [mois, annee]);

    const inserts = members => Promise.all(members.map(m => {
      const montant = totalParts > 0
        ? Math.round((Number(m.part_pourcentage) / totalParts) * montant_total)
        : 0;
      return db.query(`
        INSERT INTO repartitions (mois, annee, membre_id, montant, statut)
        VALUES ($1,$2,$3,$4,'en_attente') RETURNING *
      `, [mois, annee, m.id, montant]);
    }));

    await inserts(membres);
    const result = await db.queryAll(`
      SELECT r.*, m.nom, m.initiales, m.couleur, m.role
      FROM repartitions r JOIN membres m ON m.id=r.membre_id
      WHERE r.mois=$1 AND r.annee=$2 ORDER BY m.ordre
    `, [mois, annee]);

    res.json(result);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
});

router.put('/repartitions/:id', auth, async (req, res) => {
  try {
    const { montant, statut, notes } = req.body;
    const r = await db.query(`
      UPDATE repartitions SET montant=$1,statut=$2,notes=$3 WHERE id=$4 RETURNING *
    `, [montant, statut, notes, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── SOLDE MENSUEL (trésorerie) ────────────────────────────────────────────────

router.get('/solde', auth, async (req, res) => {
  try {
    const now   = new Date();
    const mois  = parseInt(req.query.mois,  10) || now.getMonth() + 1;
    const annee = parseInt(req.query.annee, 10) || now.getFullYear();
    const row   = await db.queryOne('SELECT * FROM solde_mensuel WHERE mois=$1 AND annee=$2', [mois, annee]);
    res.json(row || { mois, annee, cash_debut: 0, notes: '' });
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.put('/solde', auth, async (req, res) => {
  try {
    const now   = new Date();
    const mois  = parseInt(req.query.mois,  10) || now.getMonth() + 1;
    const annee = parseInt(req.query.annee, 10) || now.getFullYear();
    const { cash_debut, notes } = req.body;

    const existing = await db.queryOne('SELECT id FROM solde_mensuel WHERE mois=$1 AND annee=$2', [mois, annee]);
    if (existing) {
      const r = await db.query(
        'UPDATE solde_mensuel SET cash_debut=$1,notes=$2 WHERE mois=$3 AND annee=$4 RETURNING *',
        [cash_debut, notes, mois, annee]
      );
      res.json(r.rows[0]);
    } else {
      const r = await db.query(
        'INSERT INTO solde_mensuel (mois,annee,cash_debut,notes) VALUES ($1,$2,$3,$4) RETURNING *',
        [mois, annee, cash_debut, notes]
      );
      res.json(r.rows[0]);
    }
  } catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── TRÉSORERIE GLOBALE (dashboard financier) ─────────────────────────────────
// Agrège tout pour afficher le résumé du mois

router.get('/tresorerie', auth, async (req, res) => {
  try {
    const now   = new Date();
    const mois  = parseInt(req.query.mois,  10) || now.getMonth() + 1;
    const annee = parseInt(req.query.annee, 10) || now.getFullYear();

    // Cash de début du mois
    const solde = await db.queryOne(
      'SELECT * FROM solde_mensuel WHERE mois=$1 AND annee=$2', [mois, annee]
    );
    const cashDebut = Number(solde?.cash_debut || 0);

    // Revenus locatifs (paiements validés ce mois)
    const { total: revenusLoyers } = await db.queryOne(`
      SELECT COALESCE(SUM(p.montant),0) as total
      FROM paiements p WHERE p.statut='paye' AND p.mois=$1 AND p.annee=$2
    `, [mois, annee]);

    // Détail revenus par bien / quartier
    const detailRevenus = await db.queryAll(`
      SELECT b.nom as bien_nom, b.quartier, COALESCE(SUM(p.montant),0) as total
      FROM paiements p
      JOIN biens b ON b.id=p.bien_id
      WHERE p.statut='paye' AND p.mois=$1 AND p.annee=$2
      GROUP BY b.nom, b.quartier ORDER BY total DESC
    `, [mois, annee]);

    // Dépenses du mois
    const depensesMois = await db.queryAll(`
      SELECT * FROM depenses
      WHERE (mois=$1 AND annee=$2) OR recurrent=TRUE
      ORDER BY categorie, libelle
    `, [mois, annee]);

    const totalDepenses = depensesMois.reduce((s, d) => s + Number(d.montant), 0);

    // Répartitions du mois
    const repartitions = await db.queryAll(`
      SELECT r.*, m.nom, m.initiales, m.couleur, m.role, m.part_pourcentage
      FROM repartitions r JOIN membres m ON m.id=r.membre_id
      WHERE r.mois=$1 AND r.annee=$2 ORDER BY m.ordre
    `, [mois, annee]);
    const totalReparti = repartitions.reduce((s, r) => s + Number(r.montant), 0);

    // Calculs
    const totalEntrants  = cashDebut + Number(revenusLoyers);
    const aRepartir      = Number(revenusLoyers) - totalDepenses;
    const cashFin        = totalEntrants - totalDepenses - totalReparti;

    // Membres
    const membres = await db.queryAll('SELECT * FROM membres WHERE actif=TRUE ORDER BY ordre');

    res.json({
      mois, annee,
      cashDebut,
      revenusLoyers:   Number(revenusLoyers),
      detailRevenus,
      depenses:        depensesMois,
      totalDepenses,
      aRepartir:       Math.max(0, aRepartir),
      repartitions,
      totalReparti,
      cashFin,
      membres,
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;
