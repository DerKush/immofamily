const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../database/db');

// GET /api/biens
router.get('/', auth, (req, res) => {
  const { quartier, statut, q } = req.query;
  let sql = `
    SELECT b.*, 
      (SELECT l.nom FROM locataires l WHERE l.bien_id = b.id LIMIT 1) as locataire_nom
    FROM biens b WHERE 1=1
  `;
  const params = [];
  if (quartier) { sql += ' AND b.quartier = ?'; params.push(quartier); }
  if (statut)   { sql += ' AND b.statut = ?';   params.push(statut); }
  if (q)        { sql += ' AND (b.nom LIKE ? OR b.quartier LIKE ? OR b.type LIKE ?)';
                  params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += ' ORDER BY b.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/biens/:id
router.get('/:id', auth, (req, res) => {
  const bien = db.prepare(`
    SELECT b.*,
      l.id as loc_id, l.nom as locataire_nom, l.telephone as loc_tel,
      l.date_entree, l.date_echeance
    FROM biens b
    LEFT JOIN locataires l ON l.bien_id = b.id
    WHERE b.id = ?
  `).get(req.params.id);
  if (!bien) return res.status(404).json({ error: 'Bien non trouvé' });
  res.json(bien);
});

// POST /api/biens
router.post('/', auth, (req, res) => {
  const { nom, quartier, type, superficie, loyer, statut, latitude, longitude, description } = req.body;
  if (!nom || !quartier || !loyer)
    return res.status(400).json({ error: 'Champs obligatoires: nom, quartier, loyer' });

  const info = db.prepare(`
    INSERT INTO biens (nom, quartier, type, superficie, loyer, statut, latitude, longitude, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(nom, quartier, type || 'Appartement', superficie || null, loyer,
         statut || 'vacant', latitude || null, longitude || null, description || null);

  res.status(201).json(db.prepare('SELECT * FROM biens WHERE id=?').get(info.lastInsertRowid));
});

// PUT /api/biens/:id
router.put('/:id', auth, (req, res) => {
  const { nom, quartier, type, superficie, loyer, statut, latitude, longitude, description } = req.body;
  db.prepare(`
    UPDATE biens SET nom=?, quartier=?, type=?, superficie=?, loyer=?,
      statut=?, latitude=?, longitude=?, description=? WHERE id=?
  `).run(nom, quartier, type, superficie, loyer, statut, latitude, longitude, description, req.params.id);
  res.json(db.prepare('SELECT * FROM biens WHERE id=?').get(req.params.id));
});

// DELETE /api/biens/:id
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM biens WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
