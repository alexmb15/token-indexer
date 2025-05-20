import mongoose from 'mongoose';
import { logger } from './logger.js';

export const connectMongo = async () => {
  const uri = process.env.MONGO_URI!;
  await mongoose.connect(uri, { dbName: 'tokenindexer' });
  logger.info('Mongo connected');
};
