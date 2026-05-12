import { getConfig } from './config';

describe('getConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default values when env vars are not set', () => {
    delete process.env['BRIDGE_TOKEN'];
    delete process.env['RELAY_PORT'];
    
    const config = getConfig();
    expect(config.token).toBe('');
    expect(config.relay.port).toBe(3000);
  });

  it('should return values from environment variables', () => {
    process.env['BRIDGE_TOKEN'] = 'custom-token';
    process.env['RELAY_PORT'] = '4000';
    
    const config = getConfig();
    expect(config.token).toBe('custom-token');
    expect(config.relay.port).toBe(4000);
  });
});
