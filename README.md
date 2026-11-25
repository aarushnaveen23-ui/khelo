# KHELO — Chess Training Desktop

KHELO is a Windows desktop chess-learning app. It is designed for new players first, then gradually increases the challenge as the player improves.

## What is included

- Local player profiles, progress, wins, draws and losses.
- Beginner, casual and experienced starting profiles.
- Six short starter lessons for first-time chess players.
- Legal chess rules through chess.js: legal moves, castling, en passant, promotion, check, checkmate and draw handling.
- Built-in minimax chess opponent with six training levels.
- Adaptive training rating: the opponent becomes tougher after wins and gentler after losses.
- Hint button, take-back, board flip, move history and short match-review tips.
- Optional external UCI engine selection from the desktop app.
- Electron desktop shell with context isolation and a restricted preload bridge.
- GitHub Actions workflow to build a Windows installer.

## Requirements

- Windows 10 or Windows 11 for the packaged installer.
- Node.js 24 for development and packaging.
- Internet access for the first npm install to download dependencies.

## Run the desktop app locally

Open PowerShell in the project folder and run:

    npm install
    npm run build
    npm start

The app opens in its own Electron desktop window. It does not open as a public website.

For a browser preview during UI development, run:

    npm run dev:web

Then open the local address printed by Vite.

## Build a Windows installer

Run:

    npm install
    npm run dist:win

The Windows installer is written to the release folder. It creates Start Menu and Desktop shortcuts.

## Build through GitHub Actions

1. Open the repository's Actions tab.
2. Select Build KHELO for Windows.
3. Choose Run workflow.
4. When the workflow finishes, open the run and download the KHELO-Windows-Installer artifact.

The workflow also runs when a version tag such as v1.0.0 is pushed.

## Choosing your own chess engine

Open Settings → Chess Engine → My own UCI chess engine → Browse in the installed desktop app and select a UCI-compatible engine executable. KHELO starts the selected process and requests a move using the UCI protocol. If no external engine is selected, the built-in practice AI is used.

A chess engine is not the same thing as a conversational AI. UCI engines calculate chess moves. A chat model can be integrated separately for natural-language explanations, but an API key does not automatically turn a chat model into a legal-move chess engine.

## Important notes

- The built-in opponent is a lightweight training AI. It is intended for learning and practice, not as a tournament-strength engine.
- Profiles and settings use local storage on this computer.
- No online account, password, cloud profile or multiplayer server is included in this version.
- The Windows installer is produced by GitHub Actions; it is not committed into the source repository.
