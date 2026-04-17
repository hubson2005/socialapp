const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

let profiles = [];

// ✅ ROUTE TEST
app.get('/', (req, res) => {
  res.send('API fonctionne 🚀');
});

// ✅ ROUTE PROFILES
app.get('/profiles', (req, res) => {
  res.json(profiles);
});

app.post('/profiles', (req, res) => {
  const newProfile = {
    id: Date.now(),
    ...req.body
  };
  profiles.push(newProfile);
  res.json(newProfile);
});

app.listen(5000, () => {
  console.log('Serveur lancé sur http://localhost:5000');
});