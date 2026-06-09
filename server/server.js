require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const initialize = require('./database/migrate');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['https://moulayeimmobilier.netlify.app', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/biens',      require('./routes/biens'));
app.use('/api/locataires', require('./routes/locataires'));
app.use('/api/paiements',  require('./routes/paiements'));
app.use('/api/rapports',   require('./routes/rapports'));
app.use('/api/finances',   require('./routes/finances'));

initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🏘  ImmoFamily API sur http://localhost:${PORT}`);
      console.log(`📊  Dashboard → http://localhost:5173\n`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur initialisation DB :', err);
    process.exit(1);
  });
