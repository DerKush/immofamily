/**
 * SCRIPT D'EXPORT — à exécuter UNE SEULE FOIS avant de migrer vers PostgreSQL
 * 
 * Usage (en local ou sur Render via SSH) :
 *   node server/database/export-data.js
 * 
 * Génère un fichier : server/database/export.json
 * Ce fichier sera importé automatiquement par migrate.js si la DB est vide.
 */

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const dbPath = path.join(__dirname, 'immofamily.db');

if (!fs.existsSync(dbPath)) {
  console.error('❌ Fichier immofamily.db introuvable dans', __dirname);
  process.exit(1);
}

const db = new Database(dbPath);

const data = {
  exportedAt: new Date().toISOString(),
  users:      db.prepare('SELECT * FROM users').all(),
  biens:      db.prepare('SELECT * FROM biens ORDER BY id ASC').all(),
  locataires: db.prepare('SELECT * FROM locataires ORDER BY id ASC').all(),
  paiements:  db.prepare('SELECT * FROM paiements ORDER BY id ASC').all(),
};

// Masquer les mots de passe dans les logs
console.log(`✅ Export terminé :`);
console.log(`   Users      : ${data.users.length}`);
console.log(`   Biens      : ${data.biens.length}`);
console.log(`   Locataires : ${data.locataires.length}`);
console.log(`   Paiements  : ${data.paiements.length}`);

const outPath = path.join(__dirname, 'export.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`\n📁 Sauvegardé dans : ${outPath}`);
console.log('⚠️  Ne pas commiter ce fichier si il contient des données sensibles !');

db.close();
