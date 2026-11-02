import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { Appointment, User, Session } from './models.js';

// Na hospedagem, as variáveis vêm do painel. Localmente, vêm de backend/.env.
if (!process.env.VERCEL) {
  dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
}

let connectionPromise = null;

// Reutiliza a conexão entre requisições e compartilha tentativas simultâneas.
export function connectDatabase() {
  // Preserva conexões já abertas por ferramentas de integração locais.
  if (!connectionPromise && mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }
  if (!process.env.MONGODB_URI) {
    return Promise.reject(new Error('MONGODB_URI não configurada.'));
  }
  if (!connectionPromise || mongoose.connection.readyState === 0) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 6000,
        connectTimeoutMS: 5000,
      })
      .then(async () => {
        await mongoose.connection.db.admin().command({ ping: 1 });
        await Promise.all([Appointment.init(), User.init(), Session.init()]);
        return mongoose.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }
  return connectionPromise;
}
