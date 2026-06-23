const axios = require('axios');

async function consultarSaldo(usuarioId) {
  // le pregunto al Proxy: "¿cuánto tiene este usuario?"
  const respuesta = await axios.get(`${process.env.PROXY_URL}/api/interno/saldo/${usuarioId}`);
  return respuesta.data; // esto va a ser algo como { saldo_ars: 5000, saldo_usd: 100 }
}

async function actualizarSaldo(usuarioId, moneda, monto) {
  // le pido al Proxy: "actualizá el saldo de este usuario"
  // si monto es negativo, le estoy restando plata. Si es positivo, le estoy sumando.
  const respuesta = await axios.post(`${process.env.PROXY_URL}/api/interno/actualizar-saldo`, {
    usuario_id: usuarioId,
    moneda: moneda,
    monto: monto
  });
  return respuesta.data;
}

module.exports = { consultarSaldo, actualizarSaldo };