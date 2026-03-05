import { Helius } from 'helius-sdk';

let instance: Helius | null = null;

export function getHelius(): Helius {
  if (!instance) {
    const key = process.env.HELIUS_API_KEY;
    if (!key) throw new Error('HELIUS_API_KEY is not set');
    instance = new Helius(key);
  }
  return instance;
}

export default getHelius;
