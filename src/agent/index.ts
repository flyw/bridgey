import * as pty from 'node-pty';
import { spawn } from 'child_process';
import { io } from 'socket.io-client';
import { Config } from '../types';
import * as crypto from 'crypto';
import * as os from 'os';

const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

export const runAgent = (config: Config, command: string, args: string[], usePipe: boolean = false) => {
  const agentId = crypto.randomUUID();
  const cwd = process.cwd();
  const ip = getLocalIp();
  const hostname = os.hostname();

  console.log(`Agent ID: ${agentId}`);
  console.log(`CWD: ${cwd}`);
  console.log(`IP: ${ip}`);
  console.log(`Hostname: ${hostname}`);
  console.log(`Connecting to relay at ${config.agent.serverUrl}...`);
  console.log(`Executing command (${usePipe ? 'Pipe' : 'PTY'} mode): ${command} ${args.join(' ')}`);

  const socket = io(config.agent.serverUrl, {
    auth: { token: config.token },
    query: { 
      role: 'agent',
      agentId: agentId,
      command: `${command} ${args.join(' ')}`,
      cwd: cwd,
      ip: ip,
      hostname: hostname
    }
  });

  const env = { ...process.env, TERM: 'xterm-256color' };

  if (usePipe) {
    const proc = spawn(command, args, {
      shell: true,
      env: env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    socket.on('connect', () => console.log('Connected to relay server (Pipe mode)'));
    
    proc.stdout.on('data', (data) => socket.emit('output_stream', { agentId, data: data.toString() }));
    proc.stderr.on('data', (data) => socket.emit('output_stream', { agentId, data: data.toString() }));
    socket.on('input_cmd', (cmd) => {
      proc.stdin.write(cmd);
    });

    proc.on('error', (err) => {
      console.error('Failed to start process:', err);
      socket.emit('output_stream', { agentId, data: `\n[Error] Failed to start process: ${err.message}\n` });
    });

    proc.on('exit', (code) => {
      console.log(`Process exited with code ${code}`);
      socket.emit('output_stream', { agentId, data: `\n[Process Exited with code ${code}]\n` });
      setTimeout(() => process.exit(code || 0), 1000);
    });
    } else {
    const ptyProcess = pty.spawn(command, args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: env as any
    });

    socket.on('connect', () => console.log('Connected to relay server (PTY mode)'));

    ptyProcess.onData((data) => {
      socket.emit('output_stream', { agentId, data: data.toString() });
    });

    socket.on('input_cmd', (cmd) => {
      // We now expect the caller (web frontend) to provide the correct
      // line endings (like \r) if they want to execute a command.
      // This allows raw escape sequences (like arrows) to work without triggering Enter.
      ptyProcess.write(cmd);
    });

    socket.on('resize_pty', ({ cols, rows }) => {
      try {
        console.log(`Resizing PTY to ${cols}x${rows}`);
        ptyProcess.resize(cols, rows);
      } catch (e) {
        console.error('Failed to resize PTY:', e);
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      console.log(`PTY process exited with code ${exitCode}`);
      socket.emit('output_stream', { agentId, data: `\n[PTY Process Exited with code ${exitCode}]\n` });
      setTimeout(() => process.exit(exitCode), 1000);
    });
  }

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
  });
};
