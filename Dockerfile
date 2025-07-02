ARG PW_VERSION=1.53.2
FROM mcr.microsoft.com/playwright:v${PW_VERSION}-jammy AS e2e

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# copy sources and build your webpack bundle
COPY . .
RUN pnpm build        # → dist/ with WebGL assets

# run tests by default (override in CI if you just want the image)
CMD ["npx","playwright","test","--reporter=line"]
    