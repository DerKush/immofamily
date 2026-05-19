const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../database/db');

// GET /api/rapports/mensuel?mois=5&annee=2025
router.get('/mensuel', auth, (req, res) => {
  const { mois = 5, annee = 2025 } = req.query;

  const encaisse = db.prepare(`
    SELECT COALESCE(SUM(montant),0) as total FROM paiements
    WHERE statut='paye' AND mois=? AND annee=?
  `).get(mois, annee).total;

  const attendu = db.prepare(`
    SELECT COALESCE(SUM(b.loyer),0) as total FROM biens b
    WHERE b.statut='occupe'
  `).get().total;

  const impayes = db.prepare(`
    SELECT p.*, l.nom as locataire_nom, b.nom as bien_nom
    FROM paiements p JOIN locataires l ON l.id=p.locataire_id JOIN biens b ON b.id=p.bien_id
    WHERE p.statut='impaye' AND p.mois=? AND p.annee=?
  `).all(mois, annee);

  const parQuartier = db.prepare(`
    SELECT b.quartier, COUNT(*) as nb_biens,
      COALESCE(SUM(CASE WHEN p.statut='paye' THEN p.montant ELSE 0 END),0) as revenus
    FROM biens b
    LEFT JOIN paiements p ON p.bien_id=b.id AND p.mois=? AND p.annee=?
    GROUP BY b.quartier ORDER BY revenus DESC
  `).all(mois, annee);

  const evolution = db.prepare(`
    SELECT mois, annee, SUM(montant) as total
    FROM paiements WHERE statut='paye' AND annee=?
    GROUP BY mois ORDER BY mois ASC
  `).all(annee);

  res.json({
    mois, annee, encaisse, attendu,
    taux: attendu ? Math.round((encaisse / attendu) * 100) : 0,
    impayes, parQuartier, evolution,
  });
});

module.exports = router;
