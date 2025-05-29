import mongoose from 'mongoose';
import { logger } from './logger.js';

export const connectMongo = async () => {
  const {
    MONGO_APP_USER,
    MONGO_APP_PASSWORD,
    MONGO_HOST,
    MONGO_PORT,
    MONGO_APP_DB,
  } = process.env;

  if (!MONGO_APP_USER || !MONGO_APP_PASSWORD) {
    throw new Error('Missing Mongo credentials in ENV');
  }

  const uri =
    `mongodb://${MONGO_APP_USER}:` +
    `${encodeURIComponent(MONGO_APP_PASSWORD)}@` +
    `${MONGO_HOST}:${MONGO_PORT}/` +
    `${MONGO_APP_DB}?authSource=${MONGO_APP_DB}`;

  await mongoose.connect(uri);
  logger.info('Mongo connected');
};
