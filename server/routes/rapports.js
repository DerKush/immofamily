const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../database/pool');

router.get('/mensuel', auth, async (req, res) => {
  try {
    const now   = new Date();
    const mois  = parseInt(req.query.mois,  10) || (now.getMonth() + 1);
    const annee = parseInt(req.query.annee, 10) || now.getFullYear();

    const { total: encaisse } = await db.queryOne(
      "SELECT COALESCE(SUM(montant),0) as total FROM paiements WHERE statut='paye' AND mois=$1 AND annee=$2",
      [mois, annee]
    );
    const { total: attendu } = await db.queryOne(
      "SELECT COALESCE(SUM(loyer),0) as total FROM biens WHERE statut='occupe' AND type != 'Immeuble'"
    );

    const impayes = await db.queryAll(`
      SELECT p.*, l.nom as locataire_nom, b.nom as bien_nom
      FROM paiements p
      JOIN locataires l ON l.id=p.locataire_id
      JOIN biens b      ON b.id=p.bien_id
      WHERE p.statut='impaye' AND p.mois=$1 AND p.annee=$2
    `, [mois, annee]);

    const parQuartier = await db.queryAll(`
      SELECT b.quartier, COUNT(DISTINCT b.id) as nb_biens,
        COALESCE(SUM(CASE WHEN p.statut='paye' THEN p.montant ELSE 0 END),0) as revenus
      FROM biens b
      LEFT JOIN paiements p ON p.bien_id=b.id AND p.mois=$1 AND p.annee=$2
      WHERE b.type != 'Immeuble'
      GROUP BY b.quartier ORDER BY revenus DESC
    `, [mois, annee]);

    const evolution = await db.queryAll(
      "SELECT mois, annee, COALESCE(SUM(montant),0) as total FROM paiements WHERE statut='paye' AND annee=$1 GROUP BY mois, annee ORDER BY mois ASC",
      [annee]
    );

    const moisPrec  = mois === 1 ? 12 : mois - 1;
    const anneePrec = mois === 1 ? annee - 1 : annee;
    const { total: encaissePrec } = await db.queryOne(
      "SELECT COALESCE(SUM(montant),0) as total FROM paiements WHERE statut='paye' AND mois=$1 AND annee=$2",
      [moisPrec, anneePrec]
    );

    res.json({
      mois, annee,
      encaisse: parseInt(encaisse),
      attendu:  parseInt(attendu),
      taux: parseInt(attendu) ? Math.round((parseInt(encaisse) / parseInt(attendu)) * 100) : 0,
      impayes, parQuartier, evolution,
      moisPrecedent: {
        encaisse: parseInt(encaissePrec),
        variation: parseInt(encaissePrec) > 0
          ? Math.round(((parseInt(encaisse) - parseInt(encaissePrec)) / parseInt(encaissePrec)) * 100)
          : null,
      },
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;
