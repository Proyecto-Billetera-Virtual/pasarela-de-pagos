const nodemailer = require('nodemailer');

// Configuro la "conexión" con el servidor de mail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function enviarCodigoTransferencia(emailDestino, codigo, monto) {
  await transporter.sendMail({
    from: 'pasarela@billetera.com',
    to: emailDestino,
    subject: 'Confirmá tu transferencia',
    text: `Tu código para confirmar la transferencia de $${monto} es: ${codigo}`
  });
}

module.exports = { enviarCodigoTransferencia };
