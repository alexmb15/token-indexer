import { Schema, model } from 'mongoose';

const tokenSchema = new Schema({
  chainId: { type: Number, required: true },
  address: { type: String, required: true, lowercase: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  decimals: { type: Number, required: true },
  logoURI: String,
  tags: [String],
  verified: { type: Boolean, default: false },
  totalSupply: String,
  holders: Number
}, { timestamps: true });

tokenSchema.index({ chainId: 1, address: 1 }, { unique: true });

export const TokenModel = model('Token', tokenSchema);
