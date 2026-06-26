const axios = require('axios');

async function obtenerCotizacion() {
  // le pido a la API externa la cotización actual
  const respuesta = await axios.get(process.env.EXTERNAL_DOLAR_API);
  return respuesta.data; // { compra: 1180, venta: 1220, ... }
}

module.exports = { obtenerCotizacion };