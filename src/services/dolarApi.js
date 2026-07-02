const axios = require('axios');

async function obtenerCotizacion() {
  try {
    const respuesta = await axios.get(process.env.EXTERNAL_DOLAR_API, { timeout: 5000 });
    const data = respuesta.data;

    if (data.compra !== undefined && data.venta !== undefined) {
      return { compra: data.compra, venta: data.venta };
    }

    return data;
  } catch (error) {
    console.error('Error al obtener cotizacion:', error.message);
    return { compra: 1400, venta: 1450 };
  }
}

module.exports = { obtenerCotizacion };
