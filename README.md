# Spellbook UI

This project is the UI component of the Spellbook framework. It provides a chat interface with features similar to ChatGPT using Llama and
open large language models.

![UI demo](https://github.com/noco-ai/spellbook-docker/blob/master/ui-demo.gif)

## Licensing Note

Spellbook UI is based of a UI framework I purchased that has a restrictive license when it comes to commercial use and open source projects. They
require one commercial license be purchased for every end product. To comply with their license I am releasing this code with the CC BY-NC 4.0 license.
If you are interested in using this UI for commercial purchases a license can be obtained by contacting admin@magegpt.com.

## Features

- Multiple color schema and theme options.
- Chat interface with real-time code styling.
- System similar to ChatGPT plugins.
- LLM model auto router.
- Management of backend Element Golem nodes.
- Chat ability and application management.

## Install Guide

### Docker Install

See https://github.com/noco-ai/spellbook-docker for installing the entire Spell Book stack with Docker Compose.

### Dependencies

- Arcane Bridge >= 0.1.0
- Elemental Golem >= 0.1.0

### environments/environment.ts

You must create a environments/environment.ts file that points to the server and port that Arcane Bridge is running on. The file should have the following format.

```
export const environment = {
    production: true,
    apiUrl: 'http://localhost:3000/'
};
```

### Ubuntu 22 Server Install

```bash
apt-get update && apt-get install -y curl git ca-certificates gnupg sass
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install nodejs -y
npm install -g @angular/cli@latest
mkdir spellbook-ui
cd spellbook-ui
git clone https://github.com/noco-ai/spellbook-ui .
npm install
```

### CLI Parameters

- --host: IP address to run host on. Set to 0.0.0.0 for all interfaces. Defaults to localhost.
- --port: Port to run the application on. Defaults to 4200.

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.
