# Cosmos Journeyer Website

Official website for Cosmos Journeyer, a free and open-source space exploration game.

If you are looking for the game itself, please visit this [GitHub Repository](https://github.com/BarthPaleologue/CosmosJourneyer)

![A view of the website](cover.png)

## Quick Start

1. Clone the Cosmos Journeyer monorepo and run `pnpm install`.

2. Change to the website package:

    ```bash
    cd packages/website
    ```

3. Start the website development server:

    ```bash
    pnpm dev
    ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

Run the following from `packages/website`:

### Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm format` - Format code with oxfmt
- `pnpm format:check` - Check code formatting

### Testing & Deployment

- `pnpm test:all` - Run all checks (lint + type-check + build)
- `pnpm serve:prod` - Serve production build locally

## Tech Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library with modern features
- **TypeScript** - Type-safe JavaScript
- **Sass/SCSS** - CSS preprocessor
- **ESLint + oxfmt** - Code quality tools
