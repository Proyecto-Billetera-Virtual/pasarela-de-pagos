// fake-proxy.js
const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/interno/saldo/:id', (req, res) => {
  res.json({ saldo_ars: 5000, saldo_usd: 100 });
});

app.post('/api/interno/actualizar-saldo', (req, res) => {
  console.log('Actualización pedida:', req.body);
  res.json({ status: "ok" });
});

app.listen(8080, () => console.log('Fake proxy corriendo en 8080'));