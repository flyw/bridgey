import * as pty from 'node-pty';
import { spawn } from 'child_process';
import { io } from 'socket.io-client';
import { Config } from '../types';
import * as crypto from 'crypto';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

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

export const runAgent = (config: Config, command: string, args: string[], sessionName?: string) => {
  // Use a persistent agentId if sessionName is provided, otherwise fallback to UUID
  const agentId = sessionName 
    ? crypto.createHash('md5').update(`${os.hostname()}-${sessionName}`).digest('hex')
    : crypto.randomUUID();
  
  const pidFile = path.join(os.tmpdir(), `bridgey-agent-${agentId}.pid`);

  // Takeover logic: if an agent is already running with this ID, kill it
  if (fs.existsSync(pidFile)) {
    const oldPid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
    try {
      process.kill(oldPid, 'SIGTERM');
      console.log(`Terminated existing agent process (PID: ${oldPid}) to take over session.`);
    } catch (e) {
      // Process might not exist, that's fine
    }
  }
  fs.writeFileSync(pidFile, process.pid.toString());

  const cwd = process.cwd();
  const ip = getLocalIp();
  const hostname = os.hostname();

  console.log(`Agent ID: ${agentId} (Session: ${sessionName || 'default'})`);
  console.log(`CWD: ${cwd}`);
  console.log(`IP: ${ip}`);
  console.log(`Hostname: ${hostname}`);
  console.log(`Connecting to relay at ${config.agent.serverUrl}...`);
  console.log(`Executing command (PTY mode): ${command} ${args.join(' ')}`);

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

  const env: any = { ...process.env, TERM: 'xterm-256color' };
  
  // Set DISPLAY for X11 clipboard access (useful in headless/xrdp environments)
  if (!env.DISPLAY) {
    env.DISPLAY = ':10'; 
  }

  // Get initial terminal size if available
  const initialCols = process.stdout.columns || 80;
  const initialRows = process.stdout.rows || 30;

  const ptyProcess = pty.spawn(command, args, {
    name: 'xterm-256color',
    cols: initialCols,
    rows: initialRows,
    cwd: process.cwd(),
    env: env as any
  });

  // Enable mouse support if using tmux
  if (command === 'tmux' && sessionName) {
    setTimeout(() => {
      try {
        // Enable mouse support for the specific session and also globally
        spawn('tmux', ['set-option', '-t', sessionName, 'mouse', 'on']);
        spawn('tmux', ['set-option', '-g', 'mouse', 'on']);
        console.log(`Enabled mouse support for tmux session: ${sessionName}`);
      } catch (e) {}
    }, 2000);
  }

  // Handle local terminal interaction
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.on('data', (data) => {
      ptyProcess.write(data);
    });

    // Handle local terminal resize
    process.stdout.on('resize', () => {
      const cols = process.stdout.columns || 80;
      const rows = process.stdout.rows || 30;
      ptyProcess.resize(cols, rows);
    });
  }

  socket.on('connect', () => console.log('Connected to relay server (PTY mode)'));

  ptyProcess.onData((data) => {
    socket.emit('output_stream', { agentId, data: data.toString() });
    process.stdout.write(data);
  });

  socket.on('input_cmd', (cmd) => {
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

  socket.on('file_upload', (payload: { filename: string, data: Buffer, target?: string }) => {
    try {
      const ext = path.extname(payload.filename) || '.bin';
      let tmpPath: string;

      if (payload.target === 'cwd') {
        const clipboardDir = path.join(process.cwd(), 'clipboard');
        if (!fs.existsSync(clipboardDir)) {
          fs.mkdirSync(clipboardDir, { recursive: true });
        }
        tmpPath = path.join(clipboardDir, `upload_${crypto.randomBytes(4).toString('hex')}${ext}`);
      } else {
        tmpPath = path.join('/tmp', `bridgey_upload_${crypto.randomBytes(4).toString('hex')}${ext}`);
      }

      fs.writeFileSync(tmpPath, payload.data);
      console.log(`File saved to ${tmpPath} (${payload.data.length} bytes, target: ${payload.target || 'tmp'})`);

      // Clipboard sync logic
      const isImage = /\.(png|jpg|jpeg|gif|bmp)$/i.test(tmpPath);
      
      // Try to find a valid DISPLAY if not set
      const env = { ...process.env };
      if (!env.DISPLAY) env.DISPLAY = ':10'; // Common for XRDP as seen in ps aux

      const syncToClipboard = () => {
        if (isImage) {
          console.log(`Syncing image ${tmpPath} to clipboard...`);
          // Use xclip for image. We don't overwrite with text if it's an image
          spawn('xclip', ['-selection', 'clipboard', '-t', `image/${ext.slice(1) || 'png'}`, '-i', tmpPath], { env, detached: true, stdio: 'ignore' }).unref();
          spawn('sh', ['-c', `wl-copy < ${tmpPath}`], { env, detached: true, stdio: 'ignore' }).unref();
        } else {
          console.log(`Syncing path ${tmpPath} to clipboard as text...`);
          spawn('sh', ['-c', `echo -n "${tmpPath}" | xclip -selection clipboard`], { env, detached: true, stdio: 'ignore' }).unref();
          spawn('sh', ['-c', `echo -n "${tmpPath}" | wl-copy`], { env, detached: true, stdio: 'ignore' }).unref();
        }
      };

      syncToClipboard();

      socket.emit('upload_res', { 
        agentId, 
        filepath: tmpPath, 
        success: true 
      });
    } catch (err: any) {
      console.error('File upload failed:', err);
      socket.emit('upload_res', { 
        agentId, 
        success: false, 
        error: err.message 
      });
    }
  });

  const cleanup = () => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
    if (fs.existsSync(pidFile)) {
      try {
        const currentPid = fs.readFileSync(pidFile, 'utf8');
        if (currentPid === process.pid.toString()) {
          fs.unlinkSync(pidFile);
        }
      } catch (e) {}
    }
  };

  ptyProcess.onExit(({ exitCode }) => {
    cleanup();
    console.log(`PTY process exited with code ${exitCode}`);
    socket.emit('output_stream', { agentId, data: `\n[PTY Process Exited with code ${exitCode}]\n` });
    setTimeout(() => process.exit(exitCode), 100);
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
  });

  // Also cleanup on process signal
  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
};
