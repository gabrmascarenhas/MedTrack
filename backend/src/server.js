import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './database.js';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error('[ERRO NA CONFIGURAÇÃO] backend/.env não contém MONGODB_URI.');
  process.exit(1);
}
let stage = 'conexão';
try {
  console.log('[API] Verificando conexão real com MongoDB...');
  await connectDatabase();
  stage = 'escuta HTTP';
  const server = app.listen(PORT, HOST, () => {
    console.log('[API] MongoDB conectado e respondendo.');
    console.log(`[API] MedTrack funcionando: http://${HOST}:${PORT}/api/health`);
  });
  server.on('error', (err) => {
    console.error(`[API] Não foi possível abrir a porta ${PORT}:`, err.message);
    process.exit(1);
  });
  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(`[API] Falha durante ${stage}: ${error.message}`);
  if (/ECONNREFUSED/.test(error.message) && URI.startsWith('mongodb://127.0.0.1')) {
    console.error(
      '[API] O MongoDB LOCAL está desligado/inacessível. Verifique Get-Service MongoDB e Start-Service MongoDB.',
    );
  } else if (/querySrv/.test(error.message)) {
    console.error('[API] O .env ainda pode estar apontando para um cluster Atlas (DNS SRV).');
  }
  process.exit(1);
}
