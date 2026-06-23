const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarCodigoTransferencia(emailDestino, codigo, monto) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: emailDestino,
    subject: 'Código de confirmación de transferencia',
    text: `Tu código para confirmar la transferencia de $${monto} es: ${codigo}`,
  });
}

module.exports = { enviarCodigoTransferencia };
