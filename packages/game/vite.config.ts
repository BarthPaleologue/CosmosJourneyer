import os from "os";
import path from "path";
import { fileURLToPath } from "url";

import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig, type PluginOption } from "vite";
import glsl from "vite-plugin-glsl";
import wasm from "vite-plugin-wasm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const licenseBanner = `/*
 *  This file is part of Cosmos Journeyer
 *
 *  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
`;

const getLocalNetworkAddress = () => {
    try {
        const networkInterfaces = os.networkInterfaces();
        for (const networkInterface of Object.values(networkInterfaces)) {
            if (!networkInterface) {
                continue;
            }

            for (const address of networkInterface) {
                if (address.family === "IPv4" && !address.internal) {
                    return address.address;
                }
            }
        }
    } catch {
        return undefined;
    }

    return undefined;
};

export default defineConfig(({ mode }) => {
    const isProduction = mode === "production";
    const localNetworkAddress = isProduction ? undefined : getLocalNetworkAddress();

    return {
        base: "./",
        clearScreen: false,
        resolve: {
            tsconfigPaths: true,
        },
        define: {
            __DEV_SERVER_IP__: JSON.stringify(localNetworkAddress ?? ""),
        },
        server: {
            host: "0.0.0.0",
            port: 8080,
            strictPort: true,
            open: false,
        },
        plugins: [
            basicSsl({
                name: "cosmos-journeyer",
            }),
            glsl(),
            wasm(),
        ] as Array<PluginOption>,
        worker: {
            format: "es",
            plugins: () => [wasm()] as Array<PluginOption>,
        },
        assetsInclude: ["**/*.env", "**/*.babylon", "**/*.glb", "**/*.wasm"],
        build: {
            outDir: "dist",
            emptyOutDir: true,
            sourcemap: !isProduction,
            target: "es2025",
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, "index.html"),
                    playground: path.resolve(__dirname, "playground.html"),
                },
                output: {
                    banner: licenseBanner,
                },
            },
        },
        test: {
            environment: "jsdom",
            include: ["**/*.{test,spec}.ts"],
            exclude: ["node_modules", "dist", ".git", "tests/e2e/**"],
        },
    };
});
