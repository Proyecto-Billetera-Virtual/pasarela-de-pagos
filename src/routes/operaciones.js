const express = require('express');
const router = express.Router();
const { consultarSaldo } = require('../services/proxyClient');
const transferenciasPendientes = require('../store/transferenciasPendientes');
const { enviarCodigoTransferencia } = require('../services/mailer');

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

module.exports = router;
