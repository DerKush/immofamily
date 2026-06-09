/**
 * Migration : ajoute les tables financières
 * À appeler depuis migrate.js après createSchema()
 */
const db = require('./pool');

async function createFinancesSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS membres (
      id                SERIAL PRIMARY KEY,
      nom               TEXT NOT NULL,
      initiales         TEXT,
      couleur           TEXT DEFAULT '#4F46E5',
      role              TEXT DEFAULT '',
      part_pourcentage  REAL DEFAULT 25,
      actif             BOOLEAN DEFAULT TRUE,
      ordre             INTEGER DEFAULT 99,
      created_at        TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories_depenses (
      id    SERIAL PRIMARY KEY,
      nom   TEXT NOT NULL,
      icon  TEXT DEFAULT '💸',
      type  TEXT DEFAULT 'fixe'
    );

    CREATE TABLE IF NOT EXISTS depenses (
      id           SERIAL PRIMARY KEY,
      libelle      TEXT NOT NULL,
      montant      INTEGER NOT NULL DEFAULT 0,
      categorie    TEXT DEFAULT 'Autre',
      type         TEXT DEFAULT 'fixe',
      recurrent    BOOLEAN DEFAULT FALSE,
      mois         INTEGER,
      annee        INTEGER,
      bien_id      INTEGER REFERENCES biens(id) ON DELETE SET NULL,
      notes        TEXT,
      created_at   TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS repartitions (
      id          SERIAL PRIMARY KEY,
      mois        INTEGER NOT NULL,
      annee       INTEGER NOT NULL,
      membre_id   INTEGER REFERENCES membres(id) ON DELETE CASCADE,
      montant     INTEGER DEFAULT 0,
      statut      TEXT DEFAULT 'en_attente',
      notes       TEXT,
      created_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS solde_mensuel (
      id          SERIAL PRIMARY KEY,
      mois        INTEGER NOT NULL,
      annee       INTEGER NOT NULL,
      cash_debut  INTEGER DEFAULT 0,
      notes       TEXT,
      created_at  TIMESTAMP DEFAULT NOW(),
      UNIQUE(mois, annee)
    );
  `);
  console.log('💰 Schéma finances créé');
}

async function seedFinances() {
  const { c } = await db.queryOne('SELECT COUNT(*) as c FROM membres');
  if (parseInt(c) > 0) return;

  console.log('🌱 Initialisation des membres et dépenses types…');

  // 4 membres de la famille
  await db.query(`INSERT INTO membres (nom,initiales,couleur,role,part_pourcentage,ordre) VALUES
    ('Poto',   'PO', '#EA580C', 'Gestion Cocody',       25, 1),
    ('Ali',    'AL', '#4F46E5', 'Gestion Finances',     25, 2),
    ('Po',     'P',  '#10B981', 'Membre',               25, 3),
    ('Kad',    'KD', '#8B5CF6', 'Membre',               25, 4)`);

  // Catégories
  await db.query(`INSERT INTO categories_depenses (nom,icon,type) VALUES
    ('Maison familiale',  '🏠', 'fixe'),
    ('Personnel',         '👷', 'fixe'),
    ('Provisions',        '🏦', 'provision'),
    ('Charges immeuble',  '🏢', 'fixe'),
    ('Autre',             '💸', 'variable')`);

  // Dépenses fixes récurrentes
  await db.query(`INSERT INTO depenses (libelle,montant,categorie,type,recurrent,mois,annee) VALUES
    ('Virement Maman',              200000, 'Maison familiale', 'fixe', TRUE,  5, 2026),
    ('Impôts - Provision',          500000, 'Provisions',       'provision', TRUE, 5, 2026),
    ('Gardien de nuit - Mr Sebré',  120000, 'Personnel',        'fixe', TRUE,  5, 2026),
    ('Gardien de jour',             100000, 'Personnel',        'fixe', TRUE,  5, 2026),
    ('Salaire Mariam',               70000, 'Personnel',        'fixe', TRUE,  5, 2026),
    ('Croquettes - Chien',           50000, 'Maison familiale', 'fixe', TRUE,  5, 2026),
    ('Salaire Amy',                  30000, 'Personnel',        'fixe', TRUE,  5, 2026)`);

  // Solde début mai 2026
  await db.query(
    'INSERT INTO solde_mensuel (mois,annee,cash_debut,notes) VALUES ($1,$2,$3,$4)',
    [5, 2026, 667170, 'Cash restant fin Avril (Poto qui garde)']
  );

  console.log('✅ Membres et dépenses types initialisés');
}

module.exports = { createFinancesSchema, seedFinances };
