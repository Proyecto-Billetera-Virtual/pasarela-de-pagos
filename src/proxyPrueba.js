// fake-proxy.js
const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/interno/saldo/:id', (req, res) => {
  res.json({ saldo_ars: 5000, saldo_usd: 100 });
});

let contador = 0;

app.post('/api/interno/actualizar-saldo', (req, res) => {
  contador++;
  console.log(`Llamada número ${contador}:`, req.body);

  if (contador === 2) {
    // Simulo que la segunda llamada siempre falla
    return res.status(500).json({ error: "Fallo simulado" });
  }

  res.json({ status: "ok" });
});

app.listen(8080, () => console.log('Fake proxy corriendo en 8080'));