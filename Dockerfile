ARG PW_VERSION=1.55.0
FROM mcr.microsoft.com/playwright:v${PW_VERSION}-jammy AS e2e

WORKDIR /app

# --- WebGPU prerequisites ----------------------------------------------------
# libvulkan1             – loader
# mesa-vulkan-drivers    – Lavapipe CPU Vulkan ICD
# vulkan-tools (optional)– handy for debugging with `vulkaninfo`
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libvulkan1 mesa-vulkan-drivers vulkan-tools && \
    rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# copy sources and build your webpack bundle
COPY . .
RUN pnpm build        # → dist/ with WebGL assets

# run tests by default (override in CI if you just want the image)
CMD ["npx","playwright","test","--reporter=line"]
    