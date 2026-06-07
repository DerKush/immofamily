const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../database/db');

// ── Helper : calcule le statut d'un immeuble depuis ses unités ──────────────
function statutImmeuble(unites) {
  if (!unites.length) return 'vacant';
  const nb      = unites.length;
  const occupes = unites.filter(u => u.statut === 'occupe').length;
  if (occupes === nb) return 'occupe';
  if (occupes === 0)  return 'vacant';
  return 'partiel';
}

// ── GET /api/biens ──────────────────────────────────────────────────────────
// Retourne tous les biens top-level (parent_id IS NULL)
// Pour les immeubles, inclut leurs unités dans `.unites`
router.get('/', auth, (req, res) => {
  const { quartier, statut, q } = req.query;

  let sql = `
    SELECT b.*,
      (SELECT l.nom FROM locataires l WHERE l.bien_id = b.id LIMIT 1) as locataire_nom
    FROM biens b
    WHERE b.parent_id IS NULL
  `;
  const params = [];
  if (quartier) { sql += ' AND b.quartier = ?'; params.push(quartier); }
  if (statut && statut !== 'partiel') { sql += ' AND b.statut = ?'; params.push(statut); }
  if (q) {
    sql += ' AND (b.nom LIKE ? OR b.quartier LIKE ? OR b.type LIKE ? OR b.adresse LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY b.created_at DESC';

  const biens = db.prepare(sql).all(...params);

  // Pour chaque immeuble, charger les unités
  const result = biens.map(b => {
    if (b.type !== 'Immeuble') return b;

    const unites = db.prepare(`
      SELECT u.*,
        (SELECT l.nom FROM locataires l WHERE l.bien_id = u.id LIMIT 1) as locataire_nom
      FROM biens u WHERE u.parent_id = ? ORDER BY u.nom ASC
    `).all(b.id);

    const revenuMensuel = unites.reduce((s, u) => s + (u.loyer || 0), 0);
    const nbOccupes     = unites.filter(u => u.statut === 'occupe').length;

    return {
      ...b,
      statut:         statutImmeuble(unites),
      revenuMensuel,
      nbOccupes,
      nbUnites:       unites.length,
      unites,
    };
  });

  // Filtre partiel post-requête
  const filtered = statut === 'partiel'
    ? result.filter(b => b.statut === 'partiel')
    : result;

  res.json(filtered);
});

// ── GET /api/biens/:id ───────────────────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  const bien = db.prepare(`
    SELECT b.*, l.id as loc_id, l.nom as locataire_nom, l.telephone as loc_tel,
      l.date_entree, l.date_echeance
    FROM biens b LEFT JOIN locataires l ON l.bien_id = b.id
    WHERE b.id = ?
  `).get(req.params.id);
  if (!bien) return res.status(404).json({ error: 'Bien non trouvé' });

  if (bien.type === 'Immeuble') {
    bien.unites = db.prepare(`
      SELECT u.*,
        (SELECT l.nom FROM locataires l WHERE l.bien_id = u.id LIMIT 1) as locataire_nom
      FROM biens u WHERE u.parent_id = ? ORDER BY u.nom ASC
    `).all(req.params.id);
  }
  res.json(bien);
});

// ── POST /api/biens ──────────────────────────────────────────────────────────
router.post('/', auth, (req, res) => {
  const { nom, quartier, type, superficie, loyer, statut, latitude,
          longitude, description, parent_id, adresse } = req.body;

  if (!nom || !quartier)
    return res.status(400).json({ error: 'Nom et quartier sont obligatoires.' });

  // Un immeuble n'a pas de loyer propre — il se calcule depuis ses unités
  if (type === 'Immeuble' && parent_id)
    return res.status(400).json({ error: 'Un immeuble ne peut pas être une unité d\'un autre immeuble.' });

  const loyerVal = type === 'Immeuble' ? 0 : (loyer || 0);

  const info = db.prepare(`
    INSERT INTO biens (nom, quartier, type, superficie, loyer, statut,
      latitude, longitude, description, parent_id, adresse)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nom, quartier, type || 'Appartement',
    superficie || null, loyerVal,
    statut || 'vacant',
    latitude || null, longitude || null,
    description || null,
    parent_id || null,
    adresse || null
  );

  res.status(201).json(db.prepare('SELECT * FROM biens WHERE id=?').get(info.lastInsertRowid));
});

// ── PUT /api/biens/:id ───────────────────────────────────────────────────────
router.put('/:id', auth, (req, res) => {
  const { nom, quartier, type, superficie, loyer, statut,
          latitude, longitude, description, parent_id, adresse } = req.body;

  const loyerVal = type === 'Immeuble' ? 0 : (loyer || 0);

  db.prepare(`
    UPDATE biens SET nom=?, quartier=?, type=?, superficie=?, loyer=?,
      statut=?, latitude=?, longitude=?, description=?, parent_id=?, adresse=?
    WHERE id=?
  `).run(
    nom, quartier, type, superficie || null, loyerVal,
    statut, latitude || null, longitude || null,
    description || null, parent_id || null, adresse || null,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM biens WHERE id=?').get(req.params.id));
});

// ── DELETE /api/biens/:id ────────────────────────────────────────────────────
// Si c'est un immeuble, supprime aussi ses unités (et libère leurs locataires)
router.delete('/:id', auth, (req, res) => {
  const deleteAll = db.transaction((id) => {
    // Libérer les locataires des unités
    db.prepare('UPDATE locataires SET bien_id=NULL WHERE bien_id IN (SELECT id FROM biens WHERE parent_id=?)').run(id);
    // Supprimer les unités
    db.prepare('DELETE FROM biens WHERE parent_id=?').run(id);
    // Libérer le locataire du bien lui-même
    db.prepare('UPDATE locataires SET bien_id=NULL WHERE bien_id=?').run(id);
    // Supprimer le bien
    db.prepare('DELETE FROM biens WHERE id=?').run(id);
  });
  deleteAll(req.params.id);
  res.json({ success: true });
});

// ── GET /api/biens/immeubles/liste ───────────────────────────────────────────
// Liste des immeubles pour le select "Appartient à" du BienModal
router.get('/immeubles/liste', auth, (req, res) => {
  const immeubles = db.prepare(
    "SELECT id, nom, quartier, adresse FROM biens WHERE type='Immeuble' AND parent_id IS NULL ORDER BY nom ASC"
  ).all();
  res.json(immeubles);
});

module.exports = router;
