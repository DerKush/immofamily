const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../database/db');

// GET /api/paiements?mois=5&annee=2025
router.get('/', auth, (req, res) => {
  const { mois = 5, annee = 2025 } = req.query;
  const paiements = db.prepare(`
    SELECT p.*, l.nom as locataire_nom, b.nom as bien_nom, b.quartier
    FROM paiements p
    JOIN locataires l ON l.id = p.locataire_id
    JOIN biens b ON b.id = p.bien_id
    WHERE p.mois=? AND p.annee=?
    ORDER BY p.created_at DESC
  `).all(mois, annee);
  res.json(paiements);
});

// POST /api/paiements
router.post('/', auth, (req, res) => {
  const { locataire_id, bien_id, montant, date_paiement, mode, statut, mois, annee, notes } = req.body;
  if (!locataire_id || !bien_id || !montant)
    return res.status(400).json({ error: 'locataire_id, bien_id et montant requis' });

  const info = db.prepare(`
    INSERT INTO paiements (locataire_id, bien_id, montant, date_paiement, mode, statut, mois, annee, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(locataire_id, bien_id, montant, date_paiement || null,
         mode || 'Espèces', statut || 'paye',
         mois || new Date().getMonth() + 1, annee || new Date().getFullYear(), notes || null);

  res.status(201).json(db.prepare('SELECT * FROM paiements WHERE id=?').get(info.lastInsertRowid));
});

// PUT /api/paiements/:id (marquer comme payé, etc.)
router.put('/:id', auth, (req, res) => {
  const { montant, date_paiement, mode, statut, notes } = req.body;
  db.prepare(`
    UPDATE paiements SET montant=?, date_paiement=?, mode=?, statut=?, notes=? WHERE id=?
  `).run(montant, date_paiement, mode, statut, notes, req.params.id);
  res.json(db.prepare('SELECT * FROM paiements WHERE id=?').get(req.params.id));
});

// DELETE /api/paiements/:id
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM paiements WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
