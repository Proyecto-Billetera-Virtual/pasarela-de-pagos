require('dotenv').config(); // carga las variables del .env
const express = require('express');
const app = express();

app.use(express.json()); // para poder leer JSON que te manden

app.listen(process.env.PORT, () => {
  console.log(`Pasarela corriendo en el puerto ${process.env.PORT}`);
});