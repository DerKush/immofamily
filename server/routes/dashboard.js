const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../database/db');

// GET /api/dashboard?mois=5&annee=2025
router.get('/', auth, (req, res) => {
  const now   = new Date();
  const mois  = parseInt(req.query.mois,  10) || (now.getMonth() + 1);
  const annee = parseInt(req.query.annee, 10) || now.getFullYear();

  const totalBiens  = db.prepare('SELECT COUNT(*) as c FROM biens').get().c;
  const occupes     = db.prepare("SELECT COUNT(*) as c FROM biens WHERE statut='occupe'").get().c;
  const vacants     = db.prepare("SELECT COUNT(*) as c FROM biens WHERE statut='vacant'").get().c;
  const maintenance = db.prepare("SELECT COUNT(*) as c FROM biens WHERE statut='maintenance'").get().c;

  const revenusMois = db.prepare(`
    SELECT COALESCE(SUM(montant), 0) as total
    FROM paiements WHERE statut='paye' AND mois=? AND annee=?
  `).get(mois, annee).total;

  const impayes = db.prepare(`
    SELECT COUNT(*) as c FROM paiements
    WHERE statut='impaye' AND mois=? AND annee=?
  `).get(mois, annee).c;

  const parQuartier = db.prepare(`
    SELECT b.quartier,
           COUNT(DISTINCT b.id)                                              AS nb_biens,
           SUM(CASE WHEN b.statut='occupe' THEN 1 ELSE 0 END)               AS occupes,
           COALESCE(SUM(CASE WHEN p.statut='paye' THEN p.montant END), 0)   AS revenus
    FROM biens b
    LEFT JOIN paiements p
           ON p.bien_id = b.id AND p.mois=? AND p.annee=?
    GROUP BY b.quartier
    ORDER BY revenus DESC
  `).all(mois, annee);

  const derniersLoyers = db.prepare(`
    SELECT p.*, l.nom as locataire_nom, b.nom as bien_nom, b.quartier
    FROM paiements p
    JOIN locataires l ON l.id = p.locataire_id
    JOIN biens b      ON b.id = p.bien_id
    WHERE p.mois=? AND p.annee=?
    ORDER BY p.created_at DESC LIMIT 5
  `).all(mois, annee);

  res.json({
    mois, annee,
    stats: { totalBiens, occupes, vacants, maintenance, revenusMois, impayes },
    parQuartier,
    derniersLoyers,
    tauxOccupation: totalBiens ? Math.round((occupes / totalBiens) * 100) : 0,
  });
});

module.exports = router;
