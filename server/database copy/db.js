const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const path     = require('path');

const dbPath = path.join(__dirname, 'immofamily.db');
const db     = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ─── TABLES ─────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nom        TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    role       TEXT DEFAULT 'membre',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS biens (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT NOT NULL,
    quartier    TEXT NOT NULL,
    type        TEXT NOT NULL,
    superficie  INTEGER,
    loyer       INTEGER NOT NULL DEFAULT 0,
    statut      TEXT DEFAULT 'vacant',
    latitude    REAL,
    longitude   REAL,
    description TEXT,
    parent_id   INTEGER,
    adresse     TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS locataires (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nom           TEXT NOT NULL,
    email         TEXT,
    telephone     TEXT,
    bien_id       INTEGER REFERENCES biens(id) ON DELETE SET NULL,
    date_entree   TEXT,
    date_echeance TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS paiements (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    locataire_id  INTEGER REFERENCES locataires(id),
    bien_id       INTEGER REFERENCES biens(id),
    montant       INTEGER NOT NULL,
    date_paiement TEXT,
    mode          TEXT DEFAULT 'Espèces',
    statut        TEXT DEFAULT 'en_attente',
    mois          INTEGER,
    annee         INTEGER,
    notes         TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
  );
`);

// ─── MIGRATIONS COLONNES (safe : ignore si déjà existantes) ─────────────────
const runSafe = (sql) => { try { db.prepare(sql).run(); } catch (_) {} };

runSafe('ALTER TABLE biens ADD COLUMN parent_id INTEGER');
runSafe('ALTER TABLE biens ADD COLUMN adresse TEXT');

// ─── MIGRATION 2025 → 2026 ───────────────────────────────────────────────────
const nb2025 = db.prepare('SELECT COUNT(*) as c FROM paiements WHERE annee=2025').get().c;
if (nb2025 > 0) {
  console.log(`🔄  Migration ${nb2025} paiements 2025 → 2026…`);
  db.prepare("UPDATE paiements SET annee=2026, date_paiement=REPLACE(date_paiement,'2025-','2026-') WHERE annee=2025").run();
  db.prepare("UPDATE locataires SET date_echeance=REPLACE(date_echeance,'2025-','2026-') WHERE date_echeance LIKE '2025-%'").run();
  console.log('✅  Migration 2025 → 2026 terminée.\n');
}

// ─── SEED ────────────────────────────────────────────────────────────────────
const alreadySeeded = db.prepare('SELECT COUNT(*) as c FROM users').get().c > 0;

if (!alreadySeeded) {
  console.log('🌱  Initialisation de la base de données…');

  const insertUser = db.prepare('INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)');
  insertUser.run('Admin Famille',  'admin@immofamily.ci',   bcrypt.hashSync('admin123',   10), 'admin');
  insertUser.run('Membre Famille', 'famille@immofamily.ci', bcrypt.hashSync('famille123', 10), 'membre');

  const insertBien = db.prepare(`
    INSERT INTO biens (nom, quartier, type, superficie, loyer, statut, latitude, longitude, description, parent_id, adresse)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ── Biens standards ──────────────────────────────────────────────────────
  const b1  = insertBien.run('Villa F5 Résidentielle',   'Cocody',   'Villa',       180, 650000, 'occupe',  5.356,-3.989,'Villa avec piscine, jardin, 5 chambres.',null,'Rte des Ambassadeurs, Cocody').lastInsertRowid;
  const b2  = insertBien.run('Appartement F3 Riviera',   'Riviera',  'Appartement',  90, 280000, 'occupe',  5.374,-3.970,'F3 lumineux avec balcon, vue sur lagune.',null,'Résidence Palmiers, Riviera').lastInsertRowid;
  const b3  = insertBien.run('Studio Plateau Centre',    'Plateau',  'Studio',        35, 200000, 'vacant',  5.318,-4.024,'Studio meublé en plein centre d\'affaires.',null,'Av. Botreau-Roussel, Plateau').lastInsertRowid;
  const b4  = insertBien.run('F2 Angré Cité',            'Angré',    'Appartement',   60, 180000, 'occupe',  5.385,-3.987,'F2 moderne, cuisine équipée.',null,'Cité Lauriers 3, Angré').lastInsertRowid;
  const b5  = insertBien.run('Local Commercial Marcory', 'Marcory',  'Local commercial',55,300000,'occupe', 5.297,-3.999,'Local en rez-de-chaussée, grande vitrine.',null,'Cité Kénèdougou, Marcory').lastInsertRowid;

  // ── Immeuble avec unités ─────────────────────────────────────────────────
  // Le bâtiment lui-même (loyer=0, pas de locataire)
  const imm1 = insertBien.run(
    'Immeuble Résidence Cocody',
    'Cocody', 'Immeuble', null, 0, 'occupe',
    5.362, -3.991,
    'Immeuble R+3 de 8 appartements, gardiennage 24h, parking.',
    null,
    '12 Av. Préfet Camille Adam, Cocody'
  ).lastInsertRowid;

  // Unités de l'immeuble
  const u1 = insertBien.run('Appt A1 – Rdc',  'Cocody','Appartement',70,220000,'occupe', null,null,'Appartement rdc, 2 chambres.',imm1,null).lastInsertRowid;
  const u2 = insertBien.run('Appt A2 – Rdc',  'Cocody','Studio',     40,150000,'vacant', null,null,'Studio rdc.',imm1,null).lastInsertRowid;
  const u3 = insertBien.run('Appt B1 – 1er',  'Cocody','Appartement',75,240000,'occupe', null,null,'F3 1er étage, vue jardin.',imm1,null).lastInsertRowid;
  const u4 = insertBien.run('Appt B2 – 1er',  'Cocody','Appartement',75,240000,'occupe', null,null,'F3 1er étage.',imm1,null).lastInsertRowid;
  const u5 = insertBien.run('Appt C1 – 2ème', 'Cocody','Appartement',80,260000,'occupe', null,null,'F3 2ème étage.',imm1,null).lastInsertRowid;
  const u6 = insertBien.run('Appt C2 – 2ème', 'Cocody','Studio',     42,160000,'maintenance',null,null,'En rénovation.',imm1,null).lastInsertRowid;

  // Deuxième immeuble
  const imm2 = insertBien.run(
    'Immeuble Riviera Park',
    'Riviera', 'Immeuble', null, 0, 'occupe',
    5.372, -3.968,
    'Immeuble R+2, 4 appartements, résidence fermée.',
    null,
    'Bd de la Corniche, Riviera'
  ).lastInsertRowid;

  const u7 = insertBien.run('Appt 101',       'Riviera','Appartement',90,320000,'occupe',     null,null,'F3, vue lagune.',imm2,null).lastInsertRowid;
  const u8 = insertBien.run('Appt 102',       'Riviera','Appartement',90,320000,'vacant',     null,null,'F3.',imm2,null).lastInsertRowid;
  const u9 = insertBien.run('Appt 201',       'Riviera','Appartement',95,340000,'occupe',     null,null,'F3 étage, terrasse.',imm2,null).lastInsertRowid;
  const u10= insertBien.run('Appt 202',       'Riviera','Appartement',95,340000,'occupe',     null,null,'F3 étage.',imm2,null).lastInsertRowid;

  // ── Locataires ────────────────────────────────────────────────────────────
  const insertLoc = db.prepare(`
    INSERT INTO locataires (nom, email, telephone, bien_id, date_entree, date_echeance)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const l1  = insertLoc.run('Mme Aïcha Diallo',       'aicha.diallo@email.ci',   '07 00 11 22', b1, '2023-01-15','2026-12-31').lastInsertRowid;
  const l2  = insertLoc.run('M. Jean-Baptiste Konan', 'jb.konan@email.ci',       '05 44 33 22', b2, '2024-03-01','2027-03-01').lastInsertRowid;
  const l3  = insertLoc.run('M. Sékou Traoré',        'sekou.traore@email.ci',   '01 23 45 67', b4, '2024-06-01','2026-06-01').lastInsertRowid;
  const l4  = insertLoc.run('SARL Pharmacie Moderne', 'pharma@email.ci',         '22 55 44 33', b5, '2023-07-01','2027-07-01').lastInsertRowid;
  // Locataires unités imm1
  const l5  = insertLoc.run('Famille Bamba',          'bamba@email.ci',          '07 99 88 77', u1, '2023-05-01','2026-05-01').lastInsertRowid;
  const l6  = insertLoc.run('M. Kouadio Eric',        'kouadio@email.ci',        '05 11 22 33', u3, '2024-01-01','2026-12-31').lastInsertRowid;
  const l7  = insertLoc.run('Mme Fatou Sangaré',      'fatou@email.ci',          '07 44 55 66', u4, '2024-02-01','2027-02-01').lastInsertRowid;
  const l8  = insertLoc.run('M. Ibrahim Ouédraogo',   'ibrahim@email.ci',        '01 77 88 99', u5, '2023-09-01','2026-09-01').lastInsertRowid;
  // Locataires unités imm2
  const l9  = insertLoc.run('M. Koffi Assiè',         'koffi@email.ci',          '07 33 44 55', u7, '2024-04-01','2027-04-01').lastInsertRowid;
  const l10 = insertLoc.run('M. & Mme Konaté',        'konate@email.ci',         '22 11 22 33', u9, '2023-03-01','2027-03-01').lastInsertRowid;
  const l11 = insertLoc.run('Mme Grace Adjoua',       'grace@email.ci',          '01 77 00 11', u10,'2024-08-01','2027-08-01').lastInsertRowid;

  // Mettre à jour statut biens occupés
  [b1,b2,b4,b5,u1,u3,u4,u5,u7,u9,u10].forEach(id => {
    db.prepare("UPDATE biens SET statut='occupe' WHERE id=?").run(id);
  });

  // ── Paiements 2026 ────────────────────────────────────────────────────────
  const insertPay = db.prepare(`
    INSERT INTO paiements (locataire_id, bien_id, montant, date_paiement, mode, statut, mois, annee)
    VALUES (?, ?, ?, ?, ?, ?, ?, 2026)
  `);

  const paiements = [
    // Jan-Mai 2026
    ...[1,2,3,4,5].flatMap(m => [
      [l1,  b1,  650000, `2026-0${m}-02`, 'Virement',     'paye',       m],
      [l2,  b2,  280000, `2026-0${m}-03`, 'Mobile Money', 'paye',       m],
      [l3,  b4,  180000, m===3?null:`2026-0${m}-01`, m===3?null:'Espèces', m===3?'impaye':'paye', m],
      [l4,  b5,  300000, `2026-0${m}-04`, 'Chèque',       'paye',       m],
      [l5,  u1,  220000, `2026-0${m}-05`, 'Mobile Money', 'paye',       m],
      [l6,  u3,  240000, `2026-0${m}-02`, 'Virement',     'paye',       m],
      [l7,  u4,  240000, m===5?null:`2026-0${m}-04`, m===5?null:'Espèces', m===5?'en_attente':'paye', m],
      [l8,  u5,  260000, `2026-0${m}-06`, 'Mobile Money', 'paye',       m],
      [l9,  u7,  320000, `2026-0${m}-03`, 'Virement',     'paye',       m],
      [l10, u9,  340000, `2026-0${m}-02`, 'Virement',     'paye',       m],
      [l11, u10, 340000, m===4?null:`2026-0${m}-07`, m===4?null:'Espèces', m===4?'impaye':'paye', m],
    ])
  ];
  paiements.forEach(p => insertPay.run(...p));

  console.log('✅  Base de données initialisée avec immeubles et unités.\n');
}

module.exports = db;
