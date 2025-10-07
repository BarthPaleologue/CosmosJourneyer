ARG PW_VERSION=1.55.0
FROM mcr.microsoft.com/playwright:v${PW_VERSION}-jammy AS e2e

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/game/package.json packages/game/
COPY packages/website/package.json packages/website/

RUN corepack enable \
    && PNPM_VERSION=$(node -p "const pm=require('./package.json').packageManager; pm.substring(pm.indexOf('@') + 1)") \
    && corepack prepare pnpm@${PNPM_VERSION} --activate
RUN pnpm install --frozen-lockfile

# copy sources and build your webpack bundle
COPY . .
RUN pnpm build:prod

WORKDIR /app/packages/game

# run tests by default (override in CI if you just want the image)
CMD ["npx","playwright","test","--reporter=line"]
    
