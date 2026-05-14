# Bridgey 🌉

Bridgey is a proxy system that converts local interactive CLI tools (like Gemini CLI) into a mobile-friendly web chat interface.

It allows you to run CLI tools on a local machine (e.g., behind a NAT) and interact with them from anywhere via a web browser, presented as a chat conversation.

## Features

- **Agent-Relay Architecture**: Securely bridge local CLI tools to the public internet.
- **Persistent Sessions**: Built-in **tmux** integration for session persistence and multi-client synchronization.
- **Dual Interaction**: Interact with the same session simultaneously from your local terminal and the web interface.
- **Terminal to Chat**: Converts terminal streams into chat bubbles.
- **ANSI Support**: Preserves terminal colors in the web interface.
- **Mobile Friendly**: Designed for mobile browsers.
- **Authentication**: Simple token-based authentication.

## Architecture

- **Agent**: Runs on your local machine. It manages a **tmux** session and connects to the Relay. It supports simultaneous local and remote interaction.
- **Relay**: A public-facing server that hosts the Web UI and forwards messages between the Agent and Web clients.
- **Web UI**: A responsive web interface that displays terminal output as a chat and sends user input back to the CLI.

## Quick Start

### 1. Installation

**Prerequisite: tmux**
Bridgey requires `tmux` installed on the Agent machine for session management.
```bash
# Ubuntu/Debian
sudo apt-get install tmux

# macOS
brew install tmux
```

**Bridgey Installation**
```bash
git clone https://github.com/youruser/bridgey.git
cd bridgey
npm install
npm run build
npm link
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

On your local machine, simply run:

```bash
bridgey agent start
```
This will:
1. Create or attach to a tmux session named `bridgey`.
2. Allow you to interact locally in the same terminal.
3. Simultaneously stream the session to the Relay for remote access.

To detach from the session locally without closing it, use `Ctrl+B, D`. To close the session and stop the agent, type `exit` inside the terminal.

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
