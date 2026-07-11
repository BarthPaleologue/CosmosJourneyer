import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { Readable } from "node:stream";

export const appScheme = "app";
export const appHost = "bundle";

const HeaderAcceptRanges = "accept-ranges";
const HeaderContentLength = "content-length";
const HeaderContentRange = "content-range";
const HeaderContentType = "content-type";

function getContentType(filePath: string): string {
    switch (extname(filePath).toLowerCase()) {
        case ".babylon":
            return "application/json; charset=utf-8";
        case ".css":
            return "text/css; charset=utf-8";
        case ".env":
            return "application/octet-stream";
        case ".glb":
            return "model/gltf-binary";
        case ".gltf":
            return "model/gltf+json; charset=utf-8";
        case ".html":
            return "text/html; charset=utf-8";
        case ".ico":
            return "image/x-icon";
        case ".jpeg":
        case ".jpg":
            return "image/jpeg";
        case ".js":
        case ".mjs":
            return "text/javascript; charset=utf-8";
        case ".json":
            return "application/json; charset=utf-8";
        case ".mp3":
            return "audio/mpeg";
        case ".ogg":
            return "audio/ogg";
        case ".png":
            return "image/png";
        case ".svg":
            return "image/svg+xml";
        case ".wav":
            return "audio/wav";
        case ".wasm":
            return "application/wasm";
        case ".webp":
            return "image/webp";
        default:
            return "application/octet-stream";
    }
}

function getResponseHeaders(filePath: string): Headers {
    const headers = new Headers();
    headers.set(HeaderAcceptRanges, "bytes");
    headers.set(HeaderContentType, getContentType(filePath));
    return headers;
}

function isRendererPathInsideRoot(filePath: string, rootDir: string): boolean {
    const relativePath = relative(rootDir, filePath);
    return relativePath !== "" && !relativePath.startsWith("..");
}

function shouldServeIndexHtml(urlPath: string): boolean {
    return urlPath === "/" || extname(urlPath) === "";
}

function parseRangeHeader(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
    const match = /^bytes=(\d*)-(\d*)$/u.exec(rangeHeader);
    if (match === null) {
        return null;
    }

    const startString = match[1] ?? "";
    const endString = match[2] ?? "";

    if (startString === "" && endString === "") {
        return null;
    }

    let start: number;
    let end: number;

    if (startString === "") {
        const suffixLength = Number.parseInt(endString, 10);
        if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
            return null;
        }

        start = Math.max(fileSize - suffixLength, 0);
        end = fileSize - 1;
    } else {
        start = Number.parseInt(startString, 10);
        end = endString === "" ? fileSize - 1 : Number.parseInt(endString, 10);
    }

    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || end >= fileSize) {
        return null;
    }

    return { start, end };
}

function getLocalAssetPaths(indexHtml: string, rendererDir: string): Array<string> {
    const assetPaths = new Set<string>();
    const pattern = /\b(?:src|href)="([^"]+)"/gu;

    for (const match of indexHtml.matchAll(pattern)) {
        const assetPath = match[1];
        if (assetPath === undefined || assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
            continue;
        }

        assetPaths.add(resolve(rendererDir, assetPath));
    }

    return [...assetPaths];
}

async function createFileResponse(filePath: string, request: Request): Promise<Response> {
    const fileStats = await stat(filePath);
    const rangeHeader = request.headers.get("range");
    const parsedRange = rangeHeader === null ? null : parseRangeHeader(rangeHeader, fileStats.size);
    const headers = getResponseHeaders(filePath);

    if (rangeHeader !== null && parsedRange === null) {
        headers.set(HeaderContentRange, `bytes */${fileStats.size}`);
        return new Response(null, {
            status: 416,
            headers,
        });
    }

    const start = parsedRange?.start ?? 0;
    const end = parsedRange?.end ?? fileStats.size - 1;
    const contentLength = end - start + 1;

    headers.set(HeaderContentLength, `${contentLength}`);
    if (parsedRange !== null) {
        headers.set(HeaderContentRange, `bytes ${start}-${end}/${fileStats.size}`);
    }

    if (request.method === "HEAD") {
        return new Response(null, {
            status: parsedRange === null ? 200 : 206,
            headers,
        });
    }

    const nodeStream = createReadStream(filePath, { start, end });
    return new Response(Readable.toWeb(nodeStream) as globalThis.ReadableStream<Uint8Array>, {
        status: parsedRange === null ? 200 : 206,
        headers,
    });
}

async function handleAppProtocol(rendererDir: string, request: Request): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405 });
    }

    const { host, pathname } = new URL(request.url);
    if (host !== appHost) {
        return new Response("Not found", { status: 404 });
    }

    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    let filePath = resolve(rendererDir, relativePath);

    if (!isRendererPathInsideRoot(filePath, rendererDir)) {
        return new Response("Bad request", { status: 400 });
    }

    try {
        await access(filePath);
    } catch {
        if (!shouldServeIndexHtml(pathname)) {
            return new Response("Not found", { status: 404 });
        }

        filePath = join(rendererDir, "index.html");
    }

    try {
        return await createFileResponse(filePath, request);
    } catch {
        return new Response("Not found", { status: 404 });
    }
}

export function createHandleAppProtocol(rendererDir: string): (request: Request) => Promise<Response> {
    return (request: Request) => handleAppProtocol(rendererDir, request);
}

export async function rendererBuildIsReady(rendererDir: string): Promise<boolean> {
    const indexPath = join(rendererDir, "index.html");

    try {
        const indexHtml = await readFile(indexPath, "utf8");
        const assetPaths = getLocalAssetPaths(indexHtml, rendererDir);
        await Promise.all(assetPaths.map((assetPath) => access(assetPath)));
        return true;
    } catch {
        return false;
    }
}

export async function waitForRendererBuild(rendererDir: string, timeoutMs = 5_000): Promise<boolean> {
    const pollIntervalMs = 100;
    const startTime = Date.now();

    while (!(await rendererBuildIsReady(rendererDir))) {
        if (Date.now() - startTime > timeoutMs) {
            return false;
        }

        await new Promise<void>((resolvePromise) => {
            setTimeout(resolvePromise, pollIntervalMs);
        });
    }

    return true;
}
