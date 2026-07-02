require('dotenv').config();
const express = require('express');
const operacionesRouter = require('./routes/operaciones');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Pasarela online', timestamp: new Date() });
});

app.use('/api/operaciones', operacionesRouter);

app.use((err, req, res, next) => {
  console.error('Error en pasarela:', err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

process.on('SIGHUP', () => {});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason instanceof Error ? reason.message : reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

const PORT = Number(process.env.PORT) || 6000;

try {
  const server = app.listen(PORT, () => {
    const addr = server.address();
    const port = (addr && typeof addr === 'object') ? addr.port : PORT;
    console.log(`Pasarela corriendo en el puerto ${port} (PID: ${process.pid})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`El puerto ${PORT} ya esta en uso. Cerrando...`);
    } else {
      console.error('Error del servidor:', err.message);
    }
    process.exit(1);
  });
} catch (err) {
  console.error('Error al iniciar pasarela:', err.message);
  process.exit(1);
}
