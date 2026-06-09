const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL obligatoire sur Render, désactivé en local
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('❌ PostgreSQL pool error:', err));

// Test de connexion au démarrage
pool.query('SELECT 1').then(() => {
  console.log('✅ Connecté à PostgreSQL');
}).catch(err => {
  console.error('❌ Impossible de se connecter à PostgreSQL:', err.message);
  process.exit(1);
});

const db = {
  // Retourne toutes les lignes
  queryAll: async (sql, params = []) => {
    const res = await pool.query(sql, params);
    return res.rows;
  },

  // Retourne la première ligne ou null
  queryOne: async (sql, params = []) => {
    const res = await pool.query(sql, params);
    return res.rows[0] || null;
  },

  // Retourne le résultat complet (pour INSERT ... RETURNING)
  query: async (sql, params = []) => pool.query(sql, params),

  // Exécute plusieurs requêtes dans une transaction
  transaction: async (fn) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const t = {
        queryAll: async (sql, p = []) => (await client.query(sql, p)).rows,
        queryOne: async (sql, p = []) => (await client.query(sql, p)).rows[0] || null,
        query:    (sql, p = [])       => client.query(sql, p),
      };
      const result = await fn(t);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
};

module.exports = db;
