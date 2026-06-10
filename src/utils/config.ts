import * as dotenv from 'dotenv';
import { Config, ShortcutGroup } from '../types';
import { getEnvPath } from './env';
import * as fs from 'fs';

const DEFAULT_SHORTCUTS: ShortcutGroup[] = [
  {
    name: 'Group 1',
    items: [
      { label: 'ESC', key: '\\x1b' },
      { label: 'Ctrl+C', key: '\\x03' },
      { label: 'Ctrl+V', key: '\\x16' },
      { label: 'BS', key: '\\x7f' },
      { label: 'Tab', key: '\\t' },
      { label: 'Ctrl+Y', key: '\\x19' },
      { label: '↑', key: '\\x1b[A' },
      { label: '↓', key: '\\x1b[B' },
      { label: '←', key: '\\x1b[D' },
      { label: '→', key: '\\x1b[C' },
    ]
  },
  {
    name: 'Group 2',
    items: [
      { label: 'Ctrl+B', key: '\\x02' },
      { label: 'PageUp', key: '\\x1b[5~' },
      { label: 'PageDown', key: '\\x1b[6~' },
      { label: 'q', key: 'q' },
    ]
  },
  {
    name: 'Group 3',
    items: [
      { label: 'T-New', key: '\\x02c' },
      { label: 'w0', key: '\\x020' },
      { label: 'w1', key: '\\x021' },
      { label: 'w2', key: '\\x022' },
      { label: 'w3', key: '\\x023' },
      { label: 'w4', key: '\\x024' },
    ]
  }
];

export const getConfig = (): Config => {
  // Clear existing env vars from memory to force a re-read from the file
  // this ensures that if the file was modified/deleted, we get the truth.
  const envPath = getEnvPath();
  const parsed = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
  
  let shortcuts = DEFAULT_SHORTCUTS;
  if (parsed['SHORTCUTS'] || process.env['SHORTCUTS']) {
    try {
      shortcuts = JSON.parse(parsed['SHORTCUTS'] || process.env['SHORTCUTS'] || '');
    } catch (e) {
      console.error('Failed to parse SHORTCUTS env var:', e);
    }
  }

  return {
    token: parsed['BRIDGE_TOKEN'] || process.env['BRIDGE_TOKEN'] || '',
    relay: {
      port: parseInt(parsed['RELAY_PORT'] || process.env['RELAY_PORT'] || '3000', 10),
      host: parsed['RELAY_HOST'] || process.env['RELAY_HOST'] || '0.0.0.0',
      webUser: parsed['WEB_USER'] || process.env['WEB_USER'],
      webPass: parsed['WEB_PASS'] || process.env['WEB_PASS'],
      shortcuts
    },
    agent: {
      serverUrl: parsed['RELAY_URL'] || process.env['RELAY_URL'] || 'http://0.0.0.0:3000',
    },
  };
};
