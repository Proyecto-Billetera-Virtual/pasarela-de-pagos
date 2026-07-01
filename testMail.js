require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: 'i.roth@alumno.etec.um.edu.ar', // ponés un mail donde puedas ver si llega
  subject: 'Prueba real',
  text: 'Si ves esto en tu bandeja real, funciona'
}, (error, info) => {
  if (error) {
    console.log('ERROR:', error);
  } else {
    console.log('ENVIADO:', info);
  }
});