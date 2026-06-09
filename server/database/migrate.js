const db                  = require('./pool');
const bcrypt              = require('bcryptjs');
const { createFinancesSchema, seedFinances } = require('./schema-finances');
const seedDonneesReelles  = require('./seed-donnees-reelles');

async function createSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      nom        TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT DEFAULT 'membre',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS biens (
      id          SERIAL PRIMARY KEY,
      nom         TEXT NOT NULL,
      quartier    TEXT NOT NULL,
      type        TEXT NOT NULL,
      superficie  INTEGER,
      loyer       INTEGER NOT NULL DEFAULT 0,
      statut      TEXT DEFAULT 'vacant',
      latitude    REAL,
      longitude   REAL,
      description TEXT,
      parent_id   INTEGER REFERENCES biens(id) ON DELETE CASCADE,
      adresse     TEXT,
      created_at  TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS locataires (
      id            SERIAL PRIMARY KEY,
      nom           TEXT NOT NULL,
      email         TEXT,
      telephone     TEXT,
      bien_id       INTEGER REFERENCES biens(id) ON DELETE SET NULL,
      date_entree   TEXT,
      date_echeance TEXT,
      created_at    TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS paiements (
      id            SERIAL PRIMARY KEY,
      locataire_id  INTEGER REFERENCES locataires(id),
      bien_id       INTEGER REFERENCES biens(id),
      montant       INTEGER NOT NULL,
      date_paiement TEXT,
      mode          TEXT DEFAULT 'Espèces',
      statut        TEXT DEFAULT 'en_attente',
      mois          INTEGER,
      annee         INTEGER,
      notes         TEXT,
      created_at    TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('📐 Schéma principal créé');
}

async function seedBase() {
  const { c } = await db.queryOne('SELECT COUNT(*) as c FROM users');
  if (parseInt(c) > 0) { console.log('📦 Users déjà présents.'); return; }

  await db.query('INSERT INTO users (nom,email,password,role) VALUES ($1,$2,$3,$4)',
    ['Admin Famille',  'admin@immofamily.ci',   bcrypt.hashSync('admin123',   10), 'admin']);
  await db.query('INSERT INTO users (nom,email,password,role) VALUES ($1,$2,$3,$4)',
    ['Membre Famille', 'famille@immofamily.ci', bcrypt.hashSync('famille123', 10), 'membre']);
  console.log('✅ Users créés');
}

async function initialize() {
  await createSchema();
  await createFinancesSchema();
  await seedBase();
  await seedFinances();
  await seedDonneesReelles();   // ← Données réelles Marcory / Dokui / Yopougon
}

module.exports = initialize;
