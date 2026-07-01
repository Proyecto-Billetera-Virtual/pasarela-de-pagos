const axios = require('axios');

async function consultarSaldo(usuarioId) {
  // le pregunto al Proxy: "¿cuánto tiene este usuario?"
  const respuesta = await axios.get(`${process.env.PROXY_URL}/api/interno/saldo/${usuarioId}`);
  return respuesta.data; // esto va a ser algo como { saldo_ars: 5000, saldo_usd: 100 }
}

async function actualizarSaldo(usuarioId, moneda, monto) {
  // Determino si es SUMAR o RESTAR según el signo del monto
  const accion = monto >= 0 ? "SUMAR" : "RESTAR";
  const montoAbsoluto = Math.abs(monto); // siempre positivo

  const respuesta = await axios.post(`${process.env.PROXY_URL}/api/interno/actualizar-saldo`, {
    usuario_id: usuarioId,
    accion: accion,
    moneda: moneda,
    monto: montoAbsoluto
  });
  return respuesta.data;
}

module.exports = { consultarSaldo, actualizarSaldo };