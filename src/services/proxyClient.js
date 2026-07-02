const axios = require('axios');

const PROXY_URL = process.env.PROXY_URL;

async function consultarSaldo(usuarioId) {
  const respuesta = await axios.get(`${PROXY_URL}/api/interno/saldo/${usuarioId}`);
  return respuesta.data;
}

async function actualizarSaldo(usuarioId, moneda, monto) {
  const respuesta = await axios.post(`${PROXY_URL}/api/interno/actualizar-saldo`, {
    usuario_id: usuarioId,
    moneda: moneda,
    monto: monto,
  });
  return respuesta.data;
}

async function buscarUsuario(email) {
  const respuesta = await axios.post(`${PROXY_URL}/api/interno/usuarios/buscar`, { email });
  return respuesta.data;
}

async function crearOperacionPendiente(tipo, email_usuario, datos_json) {
  const respuesta = await axios.post(`${PROXY_URL}/api/interno/operaciones/crear`, {
    tipo,
    email_usuario,
    datos_json,
  });
  return respuesta.data;
}

async function confirmarOperacionPendiente(email_usuario, codigo, tipo) {
  const respuesta = await axios.post(`${PROXY_URL}/api/interno/operaciones/confirmar`, {
    email_usuario,
    codigo,
    tipo,
  });
  return respuesta.data;
}

async function registrarMovimiento(usuario_id, tipo, moneda, monto, saldo_resultante, descripcion) {
  const respuesta = await axios.post(`${PROXY_URL}/api/interno/registrar-movimiento`, {
    usuario_id,
    tipo,
    moneda,
    monto,
    saldo_resultante,
    descripcion,
  });
  return respuesta.data;
}

module.exports = { consultarSaldo, actualizarSaldo, buscarUsuario, crearOperacionPendiente, confirmarOperacionPendiente, registrarMovimiento };
