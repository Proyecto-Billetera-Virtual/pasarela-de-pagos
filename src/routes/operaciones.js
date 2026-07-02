const express = require('express');
const router = express.Router();
const { consultarSaldo, actualizarSaldo, buscarUsuario, crearOperacionPendiente, confirmarOperacionPendiente, registrarMovimiento } = require('../services/proxyClient');
const { enviarCodigoTransferencia } = require('../services/mailer');
const { obtenerCotizacion } = require('../services/dolarApi');

function getUserId(req) {
  return req.body.usuario_origen_id || req.body.usuario_id || null;
}

function getEmail(req) {
  return req.body.email_origen || req.body.email || null;
}

async function handleCambio(req, res) {
  try {
    const usuario_id = getUserId(req);
    const tipo = req.body.tipo || req.body.tipoOperacion;
    const monto_usd = req.body.monto_usd || req.body.montoUsd;

    if (!usuario_id || !tipo || !monto_usd) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    const cotizacion = await obtenerCotizacion();
    const saldo = await consultarSaldo(usuario_id);

    if (tipo === 'compra' || tipo === 'COMPRA') {
      const costoEnPesos = monto_usd * cotizacion.venta;
      if (saldo.saldo_ars < costoEnPesos) {
        return res.status(400).json({ error: 'Saldo insuficiente en ARS' });
      }

      const { nuevo_saldo: ars_final } = await actualizarSaldo(usuario_id, 'ARS', -costoEnPesos);

      try {
        const { nuevo_saldo: usd_final } = await actualizarSaldo(usuario_id, 'USD', monto_usd);

        await registrarMovimiento(usuario_id, 'compra_usd', 'ARS', -costoEnPesos, ars_final, `Compra USD ${monto_usd} a $${cotizacion.venta}`);
        await registrarMovimiento(usuario_id, 'compra_usd', 'USD', monto_usd, usd_final, `Compra USD ${monto_usd} a $${cotizacion.venta}`);

        return res.json({
          status: 'success',
          operacion: 'compra',
          monto_usd,
          costo_ars: costoEnPesos,
          cotizacion_usada: cotizacion.venta
        });
      } catch (errorPaso2) {
        await actualizarSaldo(usuario_id, 'ARS', costoEnPesos);
        return res.status(500).json({ error: 'Compra fallida y revertida.' });
      }

    } else if (tipo === 'venta' || tipo === 'VENTA') {
      if (saldo.saldo_usd < monto_usd) {
        return res.status(400).json({ error: 'Saldo insuficiente en USD' });
      }

      const recibidoEnPesos = monto_usd * cotizacion.compra;
      const { nuevo_saldo: usd_final } = await actualizarSaldo(usuario_id, 'USD', -monto_usd);

      try {
        const { nuevo_saldo: ars_final } = await actualizarSaldo(usuario_id, 'ARS', recibidoEnPesos);

        await registrarMovimiento(usuario_id, 'venta_usd', 'USD', -monto_usd, usd_final, `Venta USD ${monto_usd} a $${cotizacion.compra}`);
        await registrarMovimiento(usuario_id, 'venta_usd', 'ARS', recibidoEnPesos, ars_final, `Venta USD ${monto_usd} a $${cotizacion.compra}`);

        return res.json({
          status: 'success',
          operacion: 'venta',
          monto_usd,
          recibido_ars: recibidoEnPesos,
          cotizacion_usada: cotizacion.compra
        });
      } catch (errorPaso2) {
        await actualizarSaldo(usuario_id, 'USD', monto_usd);
        return res.status(500).json({ error: 'Venta fallida y revertida.' });
      }

    } else {
      return res.status(400).json({ error: "Tipo de operacion invalido, use 'compra' o 'venta'" });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error: ' + error.message });
  }
}

router.post('/transferir', async (req, res) => {
  try {
    const usuario_origen_id = getUserId(req);
    const email_origen = getEmail(req);
    const destino = req.body.destino_cvu || req.body.destino;
    const { monto, moneda } = req.body;

    if (!usuario_origen_id || !destino || !monto || !moneda) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    const saldo = await consultarSaldo(usuario_origen_id);
    const saldoDisponible = moneda === 'ARS' ? saldo.saldo_ars : saldo.saldo_usd;

    if (saldoDisponible < monto) {
      return res.status(400).json({ error: 'Saldo insuficiente', saldo_disponible: saldoDisponible });
    }

    let destinoId = destino;
    if (isNaN(destino)) {
      try {
        const usuarioDestino = await buscarUsuario(destino);
        destinoId = usuarioDestino.id;
      } catch {
        return res.status(404).json({ error: 'Usuario destino no encontrado.' });
      }
    }

    const pendiente = await crearOperacionPendiente('transferencia', email_origen, {
      origen_id: usuario_origen_id,
      destino_id: destinoId,
      monto,
      moneda,
    });

    if (email_origen) {
      await enviarCodigoTransferencia(email_origen, pendiente.codigo, monto, destino, 'transferencia');
    }

    res.json({ status: 'pending_confirmation', message: 'Codigo enviado al correo.' });
  } catch (error) {
    res.status(500).json({ error: 'Error: ' + error.message });
  }
});

router.post('/confirmar-transferencia', async (req, res) => {
  try {
    const { codigo, email } = req.body;

    if (!codigo) {
      return res.status(400).json({ error: 'Codigo es obligatorio.' });
    }

    const email_usuario = email || req.body.email_origen;

    if (!email_usuario) {
      return res.status(400).json({ error: 'Email es obligatorio.' });
    }

    const confirmacion = await confirmarOperacionPendiente(email_usuario, codigo, 'transferencia');

    const { origen_id, destino_id, monto, moneda } = confirmacion.datos;

    const { nuevo_saldo: saldo_origen } = await actualizarSaldo(origen_id, moneda, -monto);

    try {
      const { nuevo_saldo: saldo_destino } = await actualizarSaldo(destino_id, moneda, monto);

      await registrarMovimiento(origen_id, 'transferencia_enviada', moneda, -monto, saldo_origen, `Transferencia a usuario ${destino_id}`);
      await registrarMovimiento(destino_id, 'transferencia_recibida', moneda, monto, saldo_destino, `Transferencia de usuario ${origen_id}`);
    } catch (errorPaso2) {
      await actualizarSaldo(origen_id, moneda, monto);
      return res.status(500).json({ error: 'La transferencia fallo y fue revertida.' });
    }

    res.json({ status: 'success', message: 'Transferencia realizada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error: ' + error.message });
  }
});

router.get('/cotizacion', async (req, res) => {
  try {
    const cotizacion = await obtenerCotizacion();
    res.json(cotizacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cotizacion' });
  }
});

router.post('/cambio', handleCambio);
router.post('/cambio-moneda', handleCambio);

router.post('/pagar', async (req, res) => {
  try {
    const usuario_id = getUserId(req);
    const email_usuario = getEmail(req);
    const { servicio, monto } = req.body;

    if (!usuario_id || !servicio || !monto) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    if (!email_usuario) {
      return res.status(400).json({ error: 'Email del usuario es obligatorio para confirmacion.' });
    }

    const saldo = await consultarSaldo(usuario_id);

    if (saldo.saldo_ars < monto) {
      return res.status(400).json({ error: 'Saldo insuficiente en ARS' });
    }

    const pendiente = await crearOperacionPendiente('pago', email_usuario, {
      usuario_id,
      servicio,
      monto,
    });

    if (email_usuario) {
      await enviarCodigoTransferencia(email_usuario, pendiente.codigo, monto, servicio, 'pago');
    }

    res.json({ status: 'pending_confirmation', message: 'Codigo enviado al correo para confirmar el pago.' });
  } catch (error) {
    res.status(500).json({ error: 'Error: ' + error.message });
  }
});

router.post('/confirmar-pago', async (req, res) => {
  try {
    const { codigo, email } = req.body;

    if (!codigo || !email) {
      return res.status(400).json({ error: 'Codigo y email son obligatorios.' });
    }

    const confirmacion = await confirmarOperacionPendiente(email, codigo, 'pago');

    const { usuario_id, servicio, monto } = confirmacion.datos;

    const { nuevo_saldo } = await actualizarSaldo(usuario_id, 'ARS', -monto);

    await registrarMovimiento(usuario_id, 'pago', 'ARS', -monto, nuevo_saldo, `Pago de ${servicio}`);

    res.json({
      status: 'pagado',
      comprobante: {
        servicio,
        monto,
        fecha: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error: ' + error.message });
  }
});

module.exports = router;
