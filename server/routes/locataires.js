const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../database/db');

// GET /api/locataires
router.get('/', auth, (req, res) => {
  const { q } = req.query;
  let sql = `
    SELECT l.*, b.nom as bien_nom, b.quartier, b.loyer,
      (SELECT p.statut FROM paiements p WHERE p.locataire_id=l.id
       AND p.mois=5 AND p.annee=2025 LIMIT 1) as statut_paiement
    FROM locataires l
    LEFT JOIN biens b ON b.id = l.bien_id
  `;
  const params = [];
  if (q) {
    sql += ' WHERE l.nom LIKE ? OR b.nom LIKE ? OR l.telephone LIKE ?';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY l.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/locataires/:id
router.get('/:id', auth, (req, res) => {
  const loc = db.prepare(`
    SELECT l.*, b.nom as bien_nom, b.quartier, b.loyer
    FROM locataires l LEFT JOIN biens b ON b.id = l.bien_id WHERE l.id=?
  `).get(req.params.id);
  if (!loc) return res.status(404).json({ error: 'Locataire non trouvé' });
  const paiements = db.prepare(
    'SELECT * FROM paiements WHERE locataire_id=? ORDER BY annee DESC, mois DESC LIMIT 12'
  ).all(req.params.id);
  res.json({ ...loc, paiements });
});

// POST /api/locataires
router.post('/', auth, (req, res) => {
  const { nom, email, telephone, bien_id, date_entree, date_echeance } = req.body;
  if (!nom) return res.status(400).json({ error: 'Le nom est obligatoire' });
  if (bien_id) db.prepare("UPDATE biens SET statut='occupe' WHERE id=?").run(bien_id);
  const info = db.prepare(`
    INSERT INTO locataires (nom, email, telephone, bien_id, date_entree, date_echeance)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(nom, email || null, telephone || null, bien_id || null, date_entree || null, date_echeance || null);
  res.status(201).json(db.prepare('SELECT * FROM locataires WHERE id=?').get(info.lastInsertRowid));
});

// PUT /api/locataires/:id
router.put('/:id', auth, (req, res) => {
  const { nom, email, telephone, bien_id, date_entree, date_echeance } = req.body;
  const old = db.prepare('SELECT * FROM locataires WHERE id=?').get(req.params.id);
  if (old && old.bien_id && old.bien_id !== bien_id)
    db.prepare("UPDATE biens SET statut='vacant' WHERE id=?").run(old.bien_id);
  if (bien_id) db.prepare("UPDATE biens SET statut='occupe' WHERE id=?").run(bien_id);
  db.prepare(`
    UPDATE locataires SET nom=?, email=?, telephone=?, bien_id=?, date_entree=?, date_echeance=? WHERE id=?
  `).run(nom, email, telephone, bien_id, date_entree, date_echeance, req.params.id);
  res.json(db.prepare('SELECT * FROM locataires WHERE id=?').get(req.params.id));
});

// DELETE /api/locataires/:id
router.delete('/:id', auth, (req, res) => {
  const loc = db.prepare('SELECT * FROM locataires WHERE id=?').get(req.params.id);
  if (loc?.bien_id) db.prepare("UPDATE biens SET statut='vacant' WHERE id=?").run(loc.bien_id);
  db.prepare('DELETE FROM locataires WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
