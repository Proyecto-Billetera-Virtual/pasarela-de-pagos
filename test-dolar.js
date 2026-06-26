require('dotenv').config();
const { obtenerCotizacion } = require('./src/services/dolarApi');

async function probar() {
  const cotizacion = await obtenerCotizacion();
  console.log("Cotización recibida:", cotizacion);
}

probar();