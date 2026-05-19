require('dotenv').config();
const express = require('express');
const cors = require('cors');
//const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['https://moulayeimmobilier.netlify.app','http://localhost:5173'], credentials: true }));
app.use(express.json());

// Routes API
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/biens',      require('./routes/biens'));
app.use('/api/locataires', require('./routes/locataires'));
app.use('/api/paiements',  require('./routes/paiements'));
app.use('/api/rapports',   require('./routes/rapports'));


app.listen(PORT, () => {
  console.log(`\n🏘  ImmoFamily API démarrée sur http://localhost:${PORT}`);
  console.log(`📊  Dashboard → http://localhost:5173\n`);
});
