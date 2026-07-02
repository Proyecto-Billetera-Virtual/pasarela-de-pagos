const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '2525'),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
}

function templateHTML(titulo, nombre, codigo, monto, tipo, info) {
  const emoji = tipo === 'transferencia' ? '↗' : '📄';
  const destinoLine = tipo === 'transferencia'
    ? `<p style="font-size:14px;color:#555;margin:0 0 4px;text-align:center">Destino: <strong>${info || '—'}</strong></p>`
    : `<p style="font-size:14px;color:#555;margin:0 0 4px;text-align:center">Servicio: <strong>${info || '—'}</strong></p>`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 10px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#FF6B35;padding:28px 40px;text-align:center">
            <div style="font-size:32px;font-weight:800;color:#fff;letter-spacing:2px">
              <span style="display:inline-block;background:#fff;color:#FF6B35;width:40px;height:40px;line-height:40px;border-radius:8px;margin-right:8px;font-size:24px">B</span>
              BurgerPay
            </div>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Tu billetera virtual</p>
          </td>
        </tr>
        <tr><td style="padding:36px 40px 24px">
          <div style="font-size:48px;text-align:center;margin:0 0 12px">${emoji}</div>
          <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 6px;text-align:center">${titulo}</h1>
          <p style="font-size:15px;color:#555;margin:0 0 20px;text-align:center">Hola <strong style="color:#FF6B35">${nombre}</strong>,</p>
          ${destinoLine}
          <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 8px;text-align:center">Monto:</p>
          <p style="font-size:32px;font-weight:800;color:#1a1a1a;text-align:center;margin:0 0 20px">$${monto}</p>
          <div style="background:#fff7f0;border:2px dashed #FF6B35;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px">
            <p style="font-size:13px;color:#888;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px">Tu codigo de confirmacion</p>
            <p style="font-size:36px;font-weight:800;color:#FF6B35;letter-spacing:10px;margin:0;font-family:monospace">${codigo}</p>
          </div>
          <p style="font-size:13px;color:#888;margin:0;text-align:center">Este codigo expira en 10 minutos.</p>
        </td></tr>
        <tr>
          <td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #eee">
            <p style="font-size:12px;color:#aaa;margin:0">BurgerPay &mdash; Billetera virtual segura</p>
            <p style="font-size:11px;color:#bbb;margin:6px 0 0">Si no solicitaste esta operacion, ignora este mensaje.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function enviarCodigoTransferencia(emailDestino, codigo, monto, info, tipo) {
  try {
    const t = getTransporter();
    const nombre = emailDestino.split('@')[0];
    const subject = tipo === 'pago' ? 'Confirma tu pago - BurgerPay' : 'Confirma tu transferencia - BurgerPay';
    const titulo = tipo === 'pago' ? 'Pago en curso' : 'Transferencia en curso';
    await t.sendMail({
      from: '"BurgerPay" <billeteravirtu@gmail.com>',
      to: emailDestino,
      subject,
      html: templateHTML(titulo, nombre, codigo, monto, tipo || 'transferencia', info)
    });
  } catch (error) {
    console.error('Error al enviar correo (no crítico):', error.message);
  }
}

module.exports = { enviarCodigoTransferencia };
