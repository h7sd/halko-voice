# Repository Guidelines

## Project Structure & Module Organization
The project is an **Electron** desktop application with a **React** renderer.
- **src/main**: Main process files, including Discord bot logic (`discord-worker.js`) and IPC handling (`main.js`).
- **src/renderer**: React-based UI managed by **Vite**. Components are organized in `src/renderer/components`.
- **src/main/preload.js**: Bridge for secure IPC between main and renderer processes.
- **dist-renderer**: Build output for the frontend assets.
- **build**: Contains installer configurations and resources.

## Agent Workflow Rules
- **Changelog**: Every update must be recorded in `src/renderer/components/ChangelogPanel.jsx` and the `APP_VERSION` in `App.jsx` must be bumped to match `package.json`.
- **Build & Push**: After completing a task, always run `npm run build` to generate the new EXE. Immediately follow with a git commit and push to ensure the update reaches the colleagues via the auto-updater.
- **UI Consistency**: Maintain the **MacOS Blue Glass** aesthetic across all new components. Use SF Pro fonts and `rgba(0, 122, 255, ...)` for accents.

## Build, Test, and Development Commands
The project uses `npm` for dependency management.
- `npm run dev`: Launches Vite and Electron in development mode with hot reload.
- `npm run build`: Compiles renderer assets via Vite and packages the Windows application via Electron-builder.
- `npm run start`: Runs the production version of Electron.
- `npm run pack`: Generates the unpacked Electron application directory.

## Architecture Overview
- **Communication**: Uses Electron's `ipcMain` and `ipcRenderer` with `contextIsolation` enabled for security.
- **TTS Engines**: Supports both `edge-tts-universal` and `groq-sdk` for text-to-speech.
- **Discord Integration**: Managed via `discord.js` and `@discordjs/voice`, often offloaded to a worker-like logic in the main process.

## Coding Style & Naming Conventions
- **React**: Functional components with hooks, using `.jsx` extension.
- **Styles**: Framer Motion for animations (`framer-motion`).
- **Config**: User settings are persisted in a `config.json` file in the application's data directory.

## Testing Guidelines
No automated testing framework is currently configured in `package.json`. Manual testing is performed using `npm run dev`.
