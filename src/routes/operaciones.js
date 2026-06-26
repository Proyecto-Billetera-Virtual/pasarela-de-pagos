const express = require('express');
const router = express.Router();
const { consultarSaldo, actualizarSaldo } = require('../services/proxyClient');
const { enviarCodigoTransferencia } = require('../services/mailer');
const transferenciasPendientes = require('../store/transferenciasPendientes');
const { obtenerCotizacion } = require('../services/dolarApi');

router.post('/transferir', async (req, res) => {
  try {
    const { usuario_origen_id, destino_cvu, monto, moneda, email_origen } = req.body;
    const saldo = await consultarSaldo(usuario_origen_id);
    const saldoDisponible = moneda === "ARS" ? saldo.saldo_ars : saldo.saldo_usd;
    if (saldoDisponible < monto) {
      return res.status(400).json({ error: "Saldo insuficiente" });
    }
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    transferenciasPendientes[codigo] = {
      usuario_origen_id,
      destino_cvu,
      monto,
      moneda,
      creado: Date.now()
    };
    await enviarCodigoTransferencia(email_origen, codigo, monto);
    res.json({ status: "pending_confirmation" });
  } catch (error) {
    res.status(500).json({ error: "Algo falló: " + error.message });
  }
});

router.post('/confirmar-transferencia', async (req, res) => {
  try {
    const { codigo } = req.body;
    const transferencia = transferenciasPendientes[codigo];
    if (!transferencia) {
      return res.status(400).json({ error: "Código inválido o ya usado" });
    }
    const { usuario_origen_id, destino_cvu, monto, moneda } = transferencia;

    // Paso 1: resto al origen
    await actualizarSaldo(usuario_origen_id, moneda, -monto);

    // Paso 2: intento sumar al destino
    try {
      await actualizarSaldo(destino_cvu, moneda, monto);
    } catch (errorPaso2) {
      // Si falla, deshago el paso 1
      await actualizarSaldo(usuario_origen_id, moneda, monto);
      throw new Error("La transferencia falló en el paso final y fue revertida. No se perdió dinero.");
    }

    delete transferenciasPendientes[codigo];
    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: "Algo falló: " + error.message });
  }
});

router.post('/cambio', async (req, res) => {
  try {
    const { usuario_id, tipo, monto_usd } = req.body; // tipo: "compra" o "venta"
    const cotizacion = await obtenerCotizacion();
    const saldo = await consultarSaldo(usuario_id);

    if (tipo === "compra") {
      const costoEnPesos = monto_usd * cotizacion.venta;
      if (saldo.saldo_ars < costoEnPesos) {
        return res.status(400).json({ error: "No te alcanzan los pesos" });
      }

      await actualizarSaldo(usuario_id, "ARS", -costoEnPesos);

      try {
        await actualizarSaldo(usuario_id, "USD", monto_usd);
      } catch (errorPaso2) {
        await actualizarSaldo(usuario_id, "ARS", costoEnPesos); // revierto
        throw new Error("La compra falló en el paso final y fue revertida. No se perdió dinero.");
      }

      return res.json({
        status: "success",
        operacion: "compra",
        monto_usd,
        costo_ars: costoEnPesos,
        cotizacion_usada: cotizacion.venta
      });

    } else if (tipo === "venta") {
      if (saldo.saldo_usd < monto_usd) {
        return res.status(400).json({ error: "No te alcanzan los dólares" });
      }

      const recibidoEnPesos = monto_usd * cotizacion.compra;

      await actualizarSaldo(usuario_id, "USD", -monto_usd);

      try {
        await actualizarSaldo(usuario_id, "ARS", recibidoEnPesos);
      } catch (errorPaso2) {
        await actualizarSaldo(usuario_id, "USD", monto_usd); // revierto
        throw new Error("La venta falló en el paso final y fue revertida. No se perdió dinero.");
      }

      return res.json({
        status: "success",
        operacion: "venta",
        monto_usd,
        recibido_ars: recibidoEnPesos,
        cotizacion_usada: cotizacion.compra
      });

    } else {
      return res.status(400).json({ error: "Tipo de operación inválido, usá 'compra' o 'venta'" });
    }
  } catch (error) {
    res.status(500).json({ error: "Algo falló: " + error.message });
  }
});

router.post('/pagar', async (req, res) => {
  try {
    const { usuario_id, servicio, monto } = req.body;
    const saldo = await consultarSaldo(usuario_id);

    if (saldo.saldo_ars < monto) {
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    await actualizarSaldo(usuario_id, "ARS", -monto);

    res.json({
      status: "pagado",
      comprobante: {
        servicio,
        monto,
        fecha: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Algo falló: " + error.message });
  }
});

module.exports = router;