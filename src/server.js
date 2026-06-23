require('dotenv').config();
const express = require('express');
const operacionesRouter = require('./routes/operaciones');

const app = express();

app.use(express.json());

app.use('/api/operaciones', operacionesRouter);

app.listen(process.env.PORT, () => {
  console.log(`Pasarela corriendo en el puerto ${process.env.PORT}`);
});