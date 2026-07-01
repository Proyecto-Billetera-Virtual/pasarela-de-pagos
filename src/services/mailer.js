const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // en puerto 587 va en false, en 465 iría en true
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // evita errores de certificado en redes universitarias
  }
});

async function enviarCodigoTransferencia(emailDestino, codigo, monto) {
  await transporter.sendMail({
    from: `"Billetera Virtual" <${process.env.EMAIL_USER}>`,
    to: emailDestino,
    subject: 'Confirmá tu transferencia',
    text: `Tu código para confirmar la transferencia de $${monto} es: ${codigo}`,
    html: `
      <h2>Confirmación de transferencia</h2>
      <p>Tu código para confirmar la transferencia de <strong>$${monto}</strong> es:</p>
      <h1 style="letter-spacing: 4px;">${codigo}</h1>
      <p>Este código expira en 10 minutos.</p>
    `
  });
}

module.exports = { enviarCodigoTransferencia };