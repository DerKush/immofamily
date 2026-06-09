const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../database/pool');

router.get('/', auth, async (req, res) => {
  try {
    const now   = new Date();
    const mois  = parseInt(req.query.mois,  10) || (now.getMonth() + 1);
    const annee = parseInt(req.query.annee, 10) || now.getFullYear();

    const { c: totalBiens }  = await db.queryOne('SELECT COUNT(*) as c FROM biens WHERE parent_id IS NULL AND type != $1', ['Immeuble']);
    const { c: occupes }     = await db.queryOne("SELECT COUNT(*) as c FROM biens WHERE statut='occupe' AND type != 'Immeuble'");
    const { c: vacants }     = await db.queryOne("SELECT COUNT(*) as c FROM biens WHERE statut='vacant' AND type != 'Immeuble'");
    const { c: maintenance } = await db.queryOne("SELECT COUNT(*) as c FROM biens WHERE statut='maintenance'");

    const { total: revenusMois } = await db.queryOne(
      "SELECT COALESCE(SUM(montant),0) as total FROM paiements WHERE statut='paye' AND mois=$1 AND annee=$2",
      [mois, annee]
    );
    const { c: impayes } = await db.queryOne(
      "SELECT COUNT(*) as c FROM paiements WHERE statut='impaye' AND mois=$1 AND annee=$2",
      [mois, annee]
    );

    const parQuartier = await db.queryAll(`
      SELECT b.quartier,
        COUNT(DISTINCT b.id)                                                   AS nb_biens,
        SUM(CASE WHEN b.statut='occupe' THEN 1 ELSE 0 END)                    AS occupes,
        COALESCE(SUM(CASE WHEN p.statut='paye' THEN p.montant END), 0)        AS revenus
      FROM biens b
      LEFT JOIN paiements p ON p.bien_id=b.id AND p.mois=$1 AND p.annee=$2
      WHERE b.type != 'Immeuble'
      GROUP BY b.quartier ORDER BY revenus DESC
    `, [mois, annee]);

    const derniersLoyers = await db.queryAll(`
      SELECT p.*, l.nom as locataire_nom, b.nom as bien_nom, b.quartier
      FROM paiements p
      JOIN locataires l ON l.id=p.locataire_id
      JOIN biens b      ON b.id=p.bien_id
      WHERE p.mois=$1 AND p.annee=$2
      ORDER BY p.created_at DESC LIMIT 5
    `, [mois, annee]);

    const evolution6mois = await db.queryAll(`
      SELECT mois, annee, COALESCE(SUM(montant),0) as total
      FROM paiements
      WHERE statut='paye'
        AND (annee * 100 + mois) <= ($1 * 100 + $2)
        AND (annee * 100 + mois) >  (($1 - 1) * 100 + $2)
      GROUP BY annee, mois ORDER BY annee ASC, mois ASC LIMIT 6
    `, [annee, mois]);

    res.json({
      mois, annee,
      stats: {
        totalBiens: parseInt(totalBiens),
        occupes:    parseInt(occupes),
        vacants:    parseInt(vacants),
        maintenance: parseInt(maintenance),
        revenusMois: parseInt(revenusMois),
        impayes:    parseInt(impayes),
      },
      parQuartier, derniersLoyers, evolution6mois,
      tauxOccupation: parseInt(totalBiens)
        ? Math.round((parseInt(occupes) / parseInt(totalBiens)) * 100)
        : 0,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;
