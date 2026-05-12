import * as dotenv from 'dotenv';
import { Config } from '../types';
import { getEnvPath } from './env';
import * as fs from 'fs';

export const getConfig = (): Config => {
  // Clear existing env vars from memory to force a re-read from the file
  // this ensures that if the file was modified/deleted, we get the truth.
  const envPath = getEnvPath();
  const parsed = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
  
  return {
    token: parsed['BRIDGE_TOKEN'] || process.env['BRIDGE_TOKEN'] || '',
    relay: {
      port: parseInt(parsed['RELAY_PORT'] || process.env['RELAY_PORT'] || '3000', 10),
      host: parsed['RELAY_HOST'] || process.env['RELAY_HOST'] || '0.0.0.0',
      webUser: parsed['WEB_USER'] || process.env['WEB_USER'],
      webPass: parsed['WEB_PASS'] || process.env['WEB_PASS'],
    },
    agent: {
      serverUrl: parsed['RELAY_URL'] || process.env['RELAY_URL'] || 'http://0.0.0.0:3000',
    },
  };
};
