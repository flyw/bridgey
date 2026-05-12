# Bridgey 🌉

Bridgey is a proxy system that converts local interactive CLI tools (like Gemini CLI) into a mobile-friendly web chat interface.

It allows you to run CLI tools on a local machine (e.g., behind a NAT) and interact with them from anywhere via a web browser, presented as a chat conversation.

## Features

- **Agent-Relay Architecture**: Securely bridge local CLI tools to the public internet.
- **Terminal to Chat**: Converts terminal streams into chat bubbles.
- **ANSI Support**: Preserves terminal colors in the web interface.
- **Mobile Friendly**: Designed for mobile browsers.
- **Authentication**: Simple token-based authentication.

## Architecture

- **Agent**: Runs on your local machine. It manages the local CLI process using PTY (Pseudo-Terminal) and connects to the Relay.
- **Relay**: A public-facing server that hosts the Web UI and forwards messages between the Agent and Web clients.
- **Web UI**: A responsive web interface that displays terminal output as a chat and sends user input back to the CLI.

## Quick Start

### 1. Installation

```bash
git clone https://github.com/youruser/bridgey.git
cd bridgey
npm install
npm run build
```

### 2. Configuration

#### Server Setup (Relay)
On your public server, generate and apply a secure token:
```bash
bridgey relay gen-token
```

#### Client Setup (Agent)
On your local machine, run the interactive setup and paste the token from the step above:
```bash
bridgey agent setup
```

### 3. Start Relay

On your public server:

```bash
bridgey relay start
```

### 4. Start Agent

On your local machine, execute the command you want to bridge:

```bash
# Bridge bash
bridgey agent start bash

# Bridge gemini chat
bridgey agent start gemini chat
```

### Tips
For the best experience, link the command globally:
```bash
npm run build
npm link
bridgey gen-token
```

### 5. Access Web UI

Open `http://your-relay-ip:3000` in your browser and enter the token.

## Development

```bash
# Run tests
npm test

# Build
npm run build
```

## License

MIT
