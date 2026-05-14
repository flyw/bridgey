# Bridgey 🌉

Bridgey is a proxy system that converts local interactive CLI tools (like Gemini CLI) into a mobile-friendly web chat interface.

It allows you to run CLI tools on a local machine (e.g., behind a NAT) and interact with them from anywhere via a web browser, presented as a chat conversation.

## Features

- **Agent-Relay Architecture**: Securely bridge local CLI tools to the public internet.
- **Persistent Sessions**: Built-in **tmux** integration. Even if you disconnect, your CLI session keeps running.
- **Smart Re-entry**: Restarting the agent automatically attaches to the existing session and preserves chat history on the web.
- **Takeover Logic**: Automatically terminates stale agent processes to prevent duplicate streams.
- **Remote Image Upload**: Upload images via the Web UI (paste or file select). Files are saved to `/tmp/` on the agent machine and automatically synced to the remote clipboard.
- **Advanced Web UI**:
  - **Multiline Input**: Auto-resizing input box with `Shift+Enter` for newlines.
  - **Quick Shortcuts**: Dedicated buttons for `Ctrl+C`, `Ctrl+V`, `Backspace`, and `Tmux` window management.
  - **Metadata Display**: Real-time display of Current Working Directory (CWD) and Hostname (including IP).
- **Dual Interaction**: Interact with the same session simultaneously from your local terminal and the web interface.
- **ANSI Support**: Preserves terminal colors in the web interface.

## Architecture

- **Agent**: Runs on your local machine. It manages a **tmux** session and connects to the Relay. It supports persistent IDs for seamless reconnections.
- **Relay**: A public-facing server that hosts the Web UI and forwards messages (including binary file data) between the Agent and Web clients.
- **Web UI**: A responsive web interface that displays terminal output and provides a rich set of interaction controls.

## Quick Start

### 1. Installation

**Prerequisite: tmux & Clipboard tools**
Bridgey requires `tmux`. For remote clipboard sync (image upload feature), `xclip` or `wl-copy` is recommended on the Agent machine.
```bash
# Ubuntu/Debian
sudo apt-get install tmux xclip

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

On your local machine:
```bash
bridgey agent start
```
This will:
1. Create or attach to a tmux session named `bridgey`.
2. Generate a persistent Agent ID based on your machine and session name.
3. Automatically kill any previous agent processes taking over the same session.
4. Stream the session to the Relay for remote access.

### 5. Interaction Tips

- **Detaching**: To detach from the session locally without closing it, use `Ctrl+B, D`.
- **Image Upload**: Click the **+** button in the Web UI, paste an image, and click **Upload**. Once you see the success notification, click the blue **Ctrl+V** button to paste the image into tools like Gemini CLI.
- **Tmux Navigation**: Use the blue **T-New** and **W0-W5** buttons in the Web UI to quickly manage tmux windows.

## Development

```bash
# Build
npm run build

# Run in development mode (using ts-node)
npm run bridgey relay start
```

## License

MIT
