const db     = require('./pool');
const bcrypt = require('bcryptjs');

// ─── SCHÉMA ───────────────────────────────────────────────────────────────────
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
  console.log('📐 Schéma PostgreSQL prêt');
}

// ─── SEED ─────────────────────────────────────────────────────────────────────
async function seed() {
  const { c } = await db.queryOne('SELECT COUNT(*) as c FROM users');
  if (parseInt(c) > 0) { console.log('📦 DB déjà peuplée, seed ignoré.'); return; }

  console.log('🌱 Initialisation des données 2026…');

  // Users
  await db.query('INSERT INTO users (nom,email,password,role) VALUES ($1,$2,$3,$4)',
    ['Admin Famille',  'admin@immofamily.ci',   bcrypt.hashSync('admin123',   10), 'admin']);
  await db.query('INSERT INTO users (nom,email,password,role) VALUES ($1,$2,$3,$4)',
    ['Membre Famille', 'famille@immofamily.ci', bcrypt.hashSync('famille123', 10), 'membre']);

  // Biens standards
  const insertBien = async (vals) => {
    const r = await db.query(`
      INSERT INTO biens (nom,quartier,type,superficie,loyer,statut,latitude,longitude,description,parent_id,adresse)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`, vals);
    return r.rows[0].id;
  };

  const b1 = await insertBien(['Villa F5 Résidentielle',   'Cocody',  'Villa',      180,650000,'occupe', 5.356,-3.989,'Villa avec piscine, jardin, 5 chambres.',null,'Rte des Ambassadeurs, Cocody']);
  const b2 = await insertBien(['Appartement F3 Riviera',   'Riviera', 'Appartement', 90,280000,'occupe', 5.374,-3.970,'F3 lumineux avec balcon.',null,'Résidence Palmiers, Riviera']);
  const b3 = await insertBien(['Studio Plateau Centre',    'Plateau', 'Studio',       35,200000,'vacant', 5.318,-4.024,'Studio meublé centre d\'affaires.',null,'Av. Botreau-Roussel, Plateau']);
  const b4 = await insertBien(['F2 Angré Cité',            'Angré',   'Appartement',  60,180000,'occupe', 5.385,-3.987,'F2 moderne, cuisine équipée.',null,'Cité Lauriers 3, Angré']);
  const b5 = await insertBien(['Local Commercial Marcory', 'Marcory', 'Local commercial',55,300000,'occupe',5.297,-3.999,'Local rez-de-chaussée.',null,'Cité Kénèdougou, Marcory']);

  // Immeuble 1
  const imm1 = await insertBien(['Immeuble Résidence Cocody','Cocody','Immeuble',null,0,'occupe',5.362,-3.991,'Immeuble R+3, 6 appartements.',null,'12 Av. Préfet Camille Adam, Cocody']);
  const u1 = await insertBien(['Appt A1 – Rdc', 'Cocody','Appartement',70,220000,'occupe',null,null,'F3 rdc.',imm1,null]);
  const u2 = await insertBien(['Appt A2 – Rdc', 'Cocody','Studio',    40,150000,'vacant',null,null,'Studio rdc.',imm1,null]);
  const u3 = await insertBien(['Appt B1 – 1er', 'Cocody','Appartement',75,240000,'occupe',null,null,'F3 1er étage.',imm1,null]);
  const u4 = await insertBien(['Appt B2 – 1er', 'Cocody','Appartement',75,240000,'occupe',null,null,'F3 1er étage.',imm1,null]);
  const u5 = await insertBien(['Appt C1 – 2ème','Cocody','Appartement',80,260000,'occupe',null,null,'F3 2ème étage.',imm1,null]);
  const u6 = await insertBien(['Appt C2 – 2ème','Cocody','Studio',    42,160000,'maintenance',null,null,'En rénovation.',imm1,null]);

  // Immeuble 2
  const imm2 = await insertBien(['Immeuble Riviera Park','Riviera','Immeuble',null,0,'occupe',5.372,-3.968,'R+2, 4 appartements.',null,'Bd de la Corniche, Riviera']);
  const u7  = await insertBien(['Appt 101','Riviera','Appartement',90,320000,'occupe',    null,null,'F3, vue lagune.',imm2,null]);
  const u8  = await insertBien(['Appt 102','Riviera','Appartement',90,320000,'vacant',    null,null,'F3.',imm2,null]);
  const u9  = await insertBien(['Appt 201','Riviera','Appartement',95,340000,'occupe',    null,null,'F3 étage, terrasse.',imm2,null]);
  const u10 = await insertBien(['Appt 202','Riviera','Appartement',95,340000,'occupe',    null,null,'F3 étage.',imm2,null]);

  // Locataires
  const insertLoc = async (vals) => {
    const r = await db.query(`
      INSERT INTO locataires (nom,email,telephone,bien_id,date_entree,date_echeance)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, vals);
    return r.rows[0].id;
  };
  const l1  = await insertLoc(['Mme Aïcha Diallo',       'aicha@email.ci',  '07 00 11 22',b1,'2023-01-15','2026-12-31']);
  const l2  = await insertLoc(['M. Jean-Baptiste Konan', 'jb@email.ci',     '05 44 33 22',b2,'2024-03-01','2027-03-01']);
  const l3  = await insertLoc(['M. Sékou Traoré',        'sekou@email.ci',  '01 23 45 67',b4,'2024-06-01','2026-06-01']);
  const l4  = await insertLoc(['SARL Pharmacie Moderne', 'pharma@email.ci', '22 55 44 33',b5,'2023-07-01','2027-07-01']);
  const l5  = await insertLoc(['Famille Bamba',          'bamba@email.ci',  '07 99 88 77',u1,'2023-05-01','2026-05-01']);
  const l6  = await insertLoc(['M. Kouadio Eric',        'kouadio@email.ci','05 11 22 33',u3,'2024-01-01','2026-12-31']);
  const l7  = await insertLoc(['Mme Fatou Sangaré',      'fatou@email.ci',  '07 44 55 66',u4,'2024-02-01','2027-02-01']);
  const l8  = await insertLoc(['M. Ibrahim Ouédraogo',   'ibrahim@email.ci','01 77 88 99',u5,'2023-09-01','2026-09-01']);
  const l9  = await insertLoc(['M. Koffi Assiè',         'koffi@email.ci',  '07 33 44 55',u7,'2024-04-01','2027-04-01']);
  const l10 = await insertLoc(['M. & Mme Konaté',        'konate@email.ci', '22 11 22 33',u9,'2023-03-01','2027-03-01']);
  const l11 = await insertLoc(['Mme Grace Adjoua',       'grace@email.ci',  '01 77 00 11',u10,'2024-08-01','2027-08-01']);

  // Paiements Jan–Mai 2026
  const insertPay = (vals) => db.query(`
    INSERT INTO paiements (locataire_id,bien_id,montant,date_paiement,mode,statut,mois,annee)
    VALUES ($1,$2,$3,$4,$5,$6,$7,2026)`, vals);

  for (const m of [1,2,3,4,5]) {
    const mm = String(m).padStart(2,'0');
    await insertPay([l1, b1, 650000, `2026-${mm}-02`,'Virement','paye',m]);
    await insertPay([l2, b2, 280000, `2026-${mm}-03`,'Mobile Money','paye',m]);
    await insertPay([l3, b4, 180000, m===3?null:`2026-${mm}-01`,m===3?null:'Espèces',m===3?'impaye':'paye',m]);
    await insertPay([l4, b5, 300000, `2026-${mm}-04`,'Chèque','paye',m]);
    await insertPay([l5, u1, 220000, `2026-${mm}-05`,'Mobile Money','paye',m]);
    await insertPay([l6, u3, 240000, `2026-${mm}-02`,'Virement','paye',m]);
    await insertPay([l7, u4, 240000, m===5?null:`2026-${mm}-04`,m===5?null:'Espèces',m===5?'en_attente':'paye',m]);
    await insertPay([l8, u5, 260000, `2026-${mm}-06`,'Mobile Money','paye',m]);
    await insertPay([l9, u7, 320000, `2026-${mm}-03`,'Virement','paye',m]);
    await insertPay([l10,u9, 340000, `2026-${mm}-02`,'Virement','paye',m]);
    await insertPay([l11,u10,340000, m===4?null:`2026-${mm}-07`,m===4?null:'Espèces',m===4?'impaye':'paye',m]);
  }

  console.log('✅ Données 2026 initialisées (Jan–Mai)\n');
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function initialize() {
  await createSchema();
  await seed();
}

module.exports = initialize;
