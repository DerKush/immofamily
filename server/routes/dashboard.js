const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../database/db');

// GET /api/dashboard
router.get('/', auth, (req, res) => {
  const totalBiens    = db.prepare('SELECT COUNT(*) as c FROM biens').get().c;
  const occupes       = db.prepare("SELECT COUNT(*) as c FROM biens WHERE statut='occupe'").get().c;
  const vacants       = db.prepare("SELECT COUNT(*) as c FROM biens WHERE statut='vacant'").get().c;
  const maintenance   = db.prepare("SELECT COUNT(*) as c FROM biens WHERE statut='maintenance'").get().c;

  const revenusMois   = db.prepare(`
    SELECT COALESCE(SUM(montant), 0) as total FROM paiements
    WHERE statut='paye' AND mois=5 AND annee=2025
  `).get().total;

  const impayes       = db.prepare(`
    SELECT COUNT(*) as c FROM paiements WHERE statut='impaye' AND mois=5 AND annee=2025
  `).get().c;

  const parQuartier   = db.prepare(`
    SELECT b.quartier,
           COUNT(*) as total,
           SUM(CASE WHEN b.statut='occupe' THEN 1 ELSE 0 END) as occupes,
           COALESCE(SUM(p.montant), 0) as revenus
    FROM biens b
    LEFT JOIN paiements p ON p.bien_id = b.id AND p.statut='paye' AND p.mois=5 AND p.annee=2025
    GROUP BY b.quartier
    ORDER BY revenus DESC
  `).all();

  const derniersLoyers = db.prepare(`
    SELECT p.*, l.nom as locataire_nom, b.nom as bien_nom, b.quartier
    FROM paiements p
    JOIN locataires l ON l.id = p.locataire_id
    JOIN biens b ON b.id = p.bien_id
    WHERE p.mois=5 AND p.annee=2025
    ORDER BY p.created_at DESC LIMIT 5
  `).all();

  res.json({
    stats: { totalBiens, occupes, vacants, maintenance, revenusMois, impayes },
    parQuartier,
    derniersLoyers,
    tauxOccupation: totalBiens ? Math.round((occupes / totalBiens) * 100) : 0,
  });
});

module.exports = router;
