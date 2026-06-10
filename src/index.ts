#!/usr/bin/env node
import { Command } from 'commander';
import { runRelay } from './relay';
import { runAgent } from './agent';
import { getConfig } from './utils/config';
import { updateEnv } from './utils/env';
import * as crypto from 'crypto';
import inquirer from 'inquirer';

const firstArg = process.argv[2];
const knownSubcommands = ['relay', 'agent', '-h', '--help', '-v', '--version'];

if (!firstArg || (!knownSubcommands.includes(firstArg) && !firstArg.startsWith('-'))) {
  const config = getConfig();
  const customArgs = process.argv.slice(2);
  const tmuxArgs = ['new-session', '-A', '-s', 'agy-mobile'];
  if (customArgs.length > 0) {
    tmuxArgs.push(...customArgs);
  }
  runAgent(config, 'tmux', tmuxArgs, 'agy-mobile');
} else {
  const program = new Command();

  program
    .name('agy-mobile')
    .description('Agy Mobile: Local CLI to Web Chat interface')
    .version('1.0.0');

  // Relay Commands
  const relay = program.command('relay').description('Relay server management');

  relay
    .command('start')
    .description('Start the relay server')
    .action(() => {
      const config = getConfig();
      runRelay(config);
    });

  relay
    .command('gen-token')
    .description('Generate and set a secure random token for the relay')
    .action(() => {
      const token = crypto.randomBytes(32).toString('hex');
      updateEnv({ BRIDGE_TOKEN: token });
      console.log('✅ New Secure Token Generated and Applied:');
      console.log(token);
      console.log('\nUse this token when running "agy-mobile agent setup" on your client machine.');
    });

  // Agent Commands
  const agent = program.command('agent').description('Agent management');

  agent
    .command('start')
    .description('Start the agent and attach to/create a tmux session')
    .action(() => {
      const config = getConfig();
      runAgent(config, 'tmux', ['new-session', '-A', '-s', 'agy-mobile'], 'agy-mobile');
    });

  agent
    .command('setup')
    .description('Interactive setup for the agent connection')
    .action(async () => {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'host',
          message: 'Enter relay server host (e.g., 1.2.3.4):',
          validate: (input) => input.length > 0 || 'Host is required'
        },
        {
          type: 'input',
          name: 'token',
          message: 'Enter agent access token:',
        },
        {
          type: 'input',
          name: 'port',
          message: 'Enter relay server port:',
          default: '3000'
        }
      ]);

      const { host, token, port } = answers;
      const finalPort = port || '3000';
      const protocol = host.startsWith('http') ? '' : 'http://';
      const baseUrl = host.includes(':') && !host.startsWith('http://') && !host.startsWith('https://') 
        ? host 
        : `${host}:${finalPort}`;
      const url = `${protocol}${baseUrl}`;

      const updates: Record<string, string> = {
        RELAY_URL: url
      };
      if (token) updates['BRIDGE_TOKEN'] = token;

      updateEnv(updates);
      console.log('\n✅ Agent configuration updated!');
      console.log(`Relay URL: ${url}`);
      if (token) console.log(`Token:     ${token}`);
    });

  program.parse();
}
