const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'immofamily.db');
const db = new Database(dbPath);

// WAL mode pour de meilleures performances
db.pragma('journal_mode = WAL');

// ─── CRÉATION DES TABLES ───────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT DEFAULT 'membre',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS biens (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT NOT NULL,
    quartier    TEXT NOT NULL,
    type        TEXT NOT NULL,
    superficie  INTEGER,
    loyer       INTEGER NOT NULL,
    statut      TEXT DEFAULT 'vacant',
    latitude    REAL,
    longitude   REAL,
    description TEXT,
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
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    locataire_id    INTEGER REFERENCES locataires(id),
    bien_id         INTEGER REFERENCES biens(id),
    montant         INTEGER NOT NULL,
    date_paiement   TEXT,
    mode            TEXT DEFAULT 'Espèces',
    statut          TEXT DEFAULT 'en_attente',
    mois            INTEGER,
    annee           INTEGER,
    notes           TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
  );
`);

// ─── SEED : insérer les données si la DB est vide ──────────────────────────

const alreadySeeded = db.prepare('SELECT COUNT(*) as c FROM users').get().c > 0;

if (!alreadySeeded) {
  console.log('🌱  Initialisation de la base de données...');

  // Utilisateurs
  const insertUser = db.prepare(
    'INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)'
  );
  insertUser.run('Admin Famille', 'admin@immofamily.ci', bcrypt.hashSync('admin123', 10), 'admin');
  insertUser.run('Membre Famille', 'famille@immofamily.ci', bcrypt.hashSync('famille123', 10), 'membre');

  // Biens
  const insertBien = db.prepare(`
    INSERT INTO biens (nom, quartier, type, superficie, loyer, statut, latitude, longitude, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const biens = [
    ['Villa F5 Résidentielle',     'Cocody',      'Villa',             180, 650000, 'occupe',    5.356,  -3.989, 'Villa avec piscine, jardin, 5 chambres, quartier résidentiel calme.'],
    ['Appartement F3 Riviera',     'Riviera',     'Appartement',        90, 280000, 'occupe',    5.374,  -3.970, 'F3 lumineux avec balcon, vue sur lagune, résidence sécurisée.'],
    ['Studio Plateau Centre',      'Plateau',     'Studio',             35, 200000, 'vacant',    5.318,  -4.024, 'Studio meublé en plein centre d\'affaires, idéal professionnel.'],
    ['F2 Angré Cité',              'Angré',       'Appartement',        60, 180000, 'occupe',    5.385,  -3.987, 'F2 moderne, cuisine équipée, parking privatif.'],
    ['Duplex Cocody II',           'Cocody',      'Villa',             140, 450000, 'occupe',    5.360,  -3.982, 'Duplex 3 chambres, terrasse panoramique, quartier Golf.'],
    ['Local Commercial Marcory',   'Marcory',     'Local commercial',   55, 300000, 'occupe',    5.297,  -3.999, 'Local en rez-de-chaussée, grande vitrine, fort passage.'],
    ['F3 Yopougon Selmer',         'Yopougon',    'Appartement',        75, 120000, 'occupe',    5.362,  -4.088, 'F3 familial, proche marché, quartier animé.'],
    ['Appartement F4 Riviera III', 'Riviera',     'Appartement',       110, 350000, 'maintenance', 5.378, -3.965,'F4 en rénovation (peinture + plomberie), disponible fin juin.'],
    ['Studio Adjamé Centre',       'Adjamé',      'Studio',             28,  80000, 'occupe',    5.363,  -4.023, 'Studio simple, bien desservi par les transports communs.'],
    ['Villa F4 Marcory Zone 4',    'Marcory',     'Villa',             120, 380000, 'occupe',    5.293,  -3.994, 'Villa 4 chambres, quartier Zone 4, garage 2 voitures.'],
    ['F2 Treichville',             'Treichville', 'Appartement',        50, 100000, 'occupe',    5.302,  -4.012, 'F2 quartier populaire, proche port, bon état général.'],
    ['F3 Angré Extension',         'Angré',       'Appartement',        85, 200000, 'vacant',    5.390,  -3.980, 'F3 dans nouvelle extension, immeuble sécurisé, ascenseur.'],
    ['Studio Cocody Abatta',       'Cocody',      'Studio',             32, 110000, 'occupe',    5.352,  -3.994, 'Studio proche université, idéal étudiant ou jeune actif.'],
    ['F4 Riviera Golf',            'Riviera',     'Appartement',       130, 420000, 'occupe',    5.370,  -3.960, 'Grand F4, résidence haut standing, piscine commune, gardiennage 24h.'],
  ];

  const insertedBiens = biens.map(b => {
    const info = insertBien.run(...b);
    return info.lastInsertRowid;
  });

  // Locataires
  const insertLoc = db.prepare(`
    INSERT INTO locataires (nom, email, telephone, bien_id, date_entree, date_echeance)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const locataires = [
    ['Mme Aïcha Diallo',         'aicha.diallo@email.ci',    '07 00 11 22 33', insertedBiens[0],  '2023-01-15', '2025-12-31'],
    ['M. Jean-Baptiste Konan',   'jb.konan@email.ci',        '05 44 33 22 11', insertedBiens[1],  '2024-03-01', '2026-03-01'],
    ['M. Sékou Traoré',          'sekou.traore@email.ci',    '01 23 45 67 89', insertedBiens[3],  '2024-06-01', '2025-06-01'],
    ['Famille Bamba',            'bamba.famille@email.ci',   '07 99 88 77 66', insertedBiens[4],  '2022-09-01', '2025-09-01'],
    ['SARL Pharmacie Moderne',   'pharmacie.moderne@ci.ci',  '22 55 44 33 22', insertedBiens[5],  '2023-07-01', '2026-07-01'],
    ['M. Mamadou Coulibaly',     'mamadou.c@email.ci',       '07 12 34 56 78', insertedBiens[6],  '2024-01-01', '2025-06-01'],
    ['Mme Fatou Sangaré',        'fatou.sangare@email.ci',   '05 98 76 54 32', insertedBiens[8],  '2024-04-01', '2025-04-01'],
    ['M. Koffi Assiè',           'koffi.assie@email.ci',     '07 33 44 55 66', insertedBiens[9],  '2023-11-01', '2025-11-01'],
    ['Mme Grace Adjoua',         'grace.adjoua@email.ci',    '01 77 88 99 00', insertedBiens[10], '2024-08-01', '2026-08-01'],
    ['M. Ibrahim Ouédraogo',     'ibrahim.o@email.ci',       '07 55 66 77 88', insertedBiens[12], '2024-09-01', '2025-09-01'],
    ['M. & Mme Konaté',          'konate.famille@email.ci',  '22 11 22 33 44', insertedBiens[13], '2023-03-01', '2026-03-01'],
  ];

  const insertedLocs = locataires.map(l => {
    const info = insertLoc.run(...l);
    return info.lastInsertRowid;
  });

  // Paiements (mai 2025)
  const insertPay = db.prepare(`
    INSERT INTO paiements (locataire_id, bien_id, montant, date_paiement, mode, statut, mois, annee)
    VALUES (?, ?, ?, ?, ?, ?, 5, 2025)
  `);

  const paiements = [
    [insertedLocs[0],  insertedBiens[0],  650000, '2025-05-02', 'Virement',     'paye'],
    [insertedLocs[1],  insertedBiens[1],  280000, '2025-05-03', 'Mobile Money', 'paye'],
    [insertedLocs[2],  insertedBiens[3],  180000, '2025-05-01', 'Espèces',      'paye'],
    [insertedLocs[3],  insertedBiens[4],  450000, '2025-05-04', 'Virement',     'paye'],
    [insertedLocs[4],  insertedBiens[5],  300000, '2025-05-01', 'Chèque',       'paye'],
    [insertedLocs[5],  insertedBiens[6],  120000, null,         null,           'impaye'],
    [insertedLocs[6],  insertedBiens[8],   80000, '2025-05-05', 'Mobile Money', 'paye'],
    [insertedLocs[7],  insertedBiens[9],  380000, null,         null,           'impaye'],
    [insertedLocs[8],  insertedBiens[10], 100000, '2025-05-06', 'Espèces',      'paye'],
    [insertedLocs[9],  insertedBiens[12], 110000, '2025-05-07', 'Mobile Money', 'en_attente'],
    [insertedLocs[10], insertedBiens[13], 420000, '2025-05-03', 'Virement',     'paye'],
  ];

  paiements.forEach(p => insertPay.run(...p));

  console.log('✅  Base de données initialisée avec succès!\n');
}

module.exports = db;
