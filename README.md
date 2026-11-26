# KHELO — Chess Training Desktop

KHELO is a Windows desktop chess-learning app for new players. It teaches the basics, provides a built-in chess opponent, adjusts training difficulty, and gives short tips after matches.

## Features

- Email + password account using Supabase Auth (no OTP screen).
- Local player profiles and progress, wins, draws, losses and rating.
- Beginner, casual and experienced starting profiles.
- Six short starter lessons for first-time chess players.
- Legal chess rules through chess.js: legal moves, castling, en passant, promotion, check, checkmate and draw handling.
- Built-in minimax chess opponent with six training levels.
- Adaptive training rating: the opponent becomes tougher after wins and gentler after losses.
- Hint button, take-back, board flip, move history and short match-review tips.
- Optional external UCI chess engine selection from the desktop app.
- Electron desktop shell with context isolation and a restricted preload bridge.
- GitHub Actions workflow to build a Windows installer.

## Requirements

- Windows 10 or Windows 11 for the packaged installer.
- Node.js 24 or newer for development and packaging.
- Internet access for the first npm install to download dependencies.

## Run locally

Open PowerShell in the project folder and run:

    npm install
    npm run build
    npm start

The app opens in its own Electron desktop window. It does not open as a public website.

## Build a Windows installer

Run:

    npm install
    npm run dist:win

The Windows installer is written to the `release` folder. It creates Start Menu and Desktop shortcuts.

## Build through GitHub Actions

1. Open the repository's Actions tab.
2. Select **Build KHELO for Windows**.
3. Choose **Run workflow**.
4. When the workflow finishes, open the run and download the `KHELO-Windows-Installer` artifact.

The workflow also runs when a version tag such as `v1.0.0` is pushed.

## Choose your own chess engine

Open Settings → Chess Engine → My own UCI chess engine → Browse in the installed desktop app and select a UCI-compatible engine executable. KHELO starts the selected process and requests a move using the UCI protocol. If no external engine is selected, the built-in practice AI is used.

A chess engine is not the same thing as a conversational AI. UCI engines calculate chess moves. A chat model can be integrated separately for natural-language explanations, but an API key does not automatically turn a chat model into a legal-move chess engine.

## Email + password login setup

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for the Supabase Project URL, public key, email provider, and account setup instructions.

For the requested no-OTP flow, Supabase's **Confirm email** provider setting must be turned off. This means a new account's email address is not verified before sign-in. Keep this setting for private testing only; a public release should use an email-verification flow.

The desktop app reads these values from `.env` at build time:

    VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
    VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY

Never put a service-role key, secret key, or database password in the desktop app.

## Windows helper files

- `INSTALL_NODEJS.bat` — checks for Node.js 24+ and offers a guided installation.
- `INSTALL_KHELO.bat` — first-time setup helper.
- `INSTALL_DEPENDENCIES.bat` — checks Node.js 24+ and installs npm dependencies.
- `SETUP_EMAIL_LOGIN.bat` — opens the `.env` configuration file.
- `RUN_KHELO.bat` — launches the desktop app.
- `BUILD_KHELO_EXE.bat` — runs checks and creates the Windows NSIS `.exe` installer in `release`.
- `CLEAN_KHELO_BUILD.bat` — removes only generated `dist` and `release` folders.
