//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { CreateScreenshotAsync } from "@babylonjs/core/Misc/screenshotTools";
import { z } from "zod";

import { RelativeCoordinatesSchema, type RelativeCoordinates } from "@/backend/save/universeCoordinates";

import { err, ok, type Result } from "@/utils/types";

import packageInfo from "../../../../package.json";

export const ScreenshotMetadataKeyword = "CosmosJourneyer.Screenshot";

export const ScreenshotMetadataSchema = z.object({
    schemaVersion: z.literal(1),
    gameVersion: z.string(),
    capturedAt: z.iso.datetime(),
    location: RelativeCoordinatesSchema,
});

export type ScreenshotMetadata = z.infer<typeof ScreenshotMetadataSchema>;
export type ScreenshotMetadataReadError = "invalidPng" | "invalidJson" | "invalidMetadata";

type ScreenshotSize = Parameters<typeof CreateScreenshotAsync>[2];

const pngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const iendChunkType = "IEND";
const internationalTextChunkType = "iTXt";

export function createScreenshotMetadata(location: RelativeCoordinates, capturedAt = new Date()): ScreenshotMetadata {
    return {
        schemaVersion: 1,
        gameVersion: packageInfo.version,
        capturedAt: capturedAt.toISOString(),
        location: location,
    };
}

export async function makeScreenshotPng(
    engine: AbstractEngine,
    camera: Camera,
    options?: Partial<{
        readonly location: RelativeCoordinates;
        readonly size?: ScreenshotSize;
    }>,
): Promise<Uint8Array> {
    const screenshotBase64 = await CreateScreenshotAsync(engine, camera, options?.size ?? { precision: 1 });
    const png = dataUrlToBytes(screenshotBase64);

    if (options?.location === undefined) {
        return png;
    }

    return addScreenshotMetadata(png, createScreenshotMetadata(options.location));
}

export function addScreenshotMetadata(png: Uint8Array, metadata: ScreenshotMetadata): Uint8Array {
    return addPngInternationalTextChunk(png, ScreenshotMetadataKeyword, JSON.stringify(metadata));
}

export function readScreenshotMetadata(
    png: Uint8Array,
): Result<ScreenshotMetadata | null, ScreenshotMetadataReadError> {
    let metadataText: string | null;
    try {
        metadataText = readPngInternationalTextChunk(png, ScreenshotMetadataKeyword);
    } catch {
        return err("invalidPng");
    }

    if (metadataText === null) {
        return ok(null);
    }

    let metadataJson: unknown;
    try {
        metadataJson = JSON.parse(metadataText);
    } catch {
        return err("invalidJson");
    }

    const metadataResult = ScreenshotMetadataSchema.safeParse(metadataJson);
    if (!metadataResult.success) {
        return err("invalidMetadata");
    }

    return ok(metadataResult.data);
}

function addPngInternationalTextChunk(png: Uint8Array, keyword: string, text: string): Uint8Array {
    assertPngSignature(png);
    validatePngTextKeyword(keyword);

    const iendOffset = findChunkOffset(png, iendChunkType);
    const chunk = createChunk(internationalTextChunkType, createInternationalTextChunkData(keyword, text));

    const result = new Uint8Array(png.length + chunk.length);
    result.set(png.subarray(0, iendOffset), 0);
    result.set(chunk, iendOffset);
    result.set(png.subarray(iendOffset), iendOffset + chunk.length);

    return result;
}

function readPngInternationalTextChunk(png: Uint8Array, keyword: string): string | null {
    assertPngSignature(png);

    let offset = pngSignature.length;
    while (offset < png.length) {
        const chunkLength = readUint32(png, offset);
        const chunkType = bytesToAscii(png.subarray(offset + 4, offset + 8));
        const dataStart = offset + 8;
        const dataEnd = dataStart + chunkLength;

        if (dataEnd + 4 > png.length) {
            throw new Error("Invalid PNG: chunk length exceeds file size");
        }

        if (chunkType === internationalTextChunkType) {
            const text = readInternationalTextChunkData(png.subarray(dataStart, dataEnd), keyword);
            if (text !== null) return text;
        }

        offset = dataEnd + 4;
    }

    return null;
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
    const base64SeparatorIndex = dataUrl.indexOf(";base64,");
    if (base64SeparatorIndex === -1) {
        throw new Error("Screenshot data URL is not base64 encoded");
    }

    const base64 = dataUrl.slice(base64SeparatorIndex + ";base64,".length);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

export function bytesToDataUrl(bytes: Uint8Array, mimeType: string): string {
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    const base64 = btoa(binary);
    return `data:${mimeType};base64,${base64}`;
}

export function downloadPng(png: Uint8Array, filename: string): void {
    const bytes = new ArrayBuffer(png.byteLength);
    new Uint8Array(bytes).set(png);

    const blob = new Blob([bytes], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
}

function createInternationalTextChunkData(keyword: string, text: string): Uint8Array {
    const keywordBytes = asciiToBytes(keyword);
    const textBytes = new TextEncoder().encode(text);
    const data = new Uint8Array(keywordBytes.length + 5 + textBytes.length);

    data.set(keywordBytes, 0);
    data[keywordBytes.length] = 0;
    data[keywordBytes.length + 1] = 0;
    data[keywordBytes.length + 2] = 0;
    data[keywordBytes.length + 3] = 0;
    data[keywordBytes.length + 4] = 0;
    data.set(textBytes, keywordBytes.length + 5);

    return data;
}

function readInternationalTextChunkData(data: Uint8Array, expectedKeyword: string): string | null {
    const keywordEnd = data.indexOf(0);
    if (keywordEnd === -1) return null;

    const keyword = bytesToAscii(data.subarray(0, keywordEnd));
    if (keyword !== expectedKeyword) return null;

    const compressionFlag = data[keywordEnd + 1];
    if (compressionFlag !== 0) return null;

    const languageTagEnd = data.indexOf(0, keywordEnd + 3);
    if (languageTagEnd === -1) return null;

    const translatedKeywordEnd = data.indexOf(0, languageTagEnd + 1);
    if (translatedKeywordEnd === -1) return null;

    return new TextDecoder().decode(data.subarray(translatedKeywordEnd + 1));
}

function createChunk(type: string, data: Uint8Array): Uint8Array {
    const typeBytes = asciiToBytes(type);
    const chunk = new Uint8Array(12 + data.length);

    writeUint32(chunk, 0, data.length);
    chunk.set(typeBytes, 4);
    chunk.set(data, 8);
    writeUint32(chunk, 8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));

    return chunk;
}

function findChunkOffset(png: Uint8Array, chunkType: string): number {
    let offset = pngSignature.length;
    while (offset < png.length) {
        const chunkLength = readUint32(png, offset);
        const type = bytesToAscii(png.subarray(offset + 4, offset + 8));
        const nextOffset = offset + 12 + chunkLength;

        if (nextOffset > png.length) {
            throw new Error("Invalid PNG: chunk length exceeds file size");
        }

        if (type === chunkType) return offset;

        offset = nextOffset;
    }

    throw new Error(`Invalid PNG: ${chunkType} chunk not found`);
}

function assertPngSignature(png: Uint8Array): void {
    if (png.length < pngSignature.length) {
        throw new Error("Invalid PNG: file is too short");
    }

    for (let i = 0; i < pngSignature.length; i++) {
        if (png[i] !== pngSignature[i]) {
            throw new Error("Invalid PNG signature");
        }
    }
}

function validatePngTextKeyword(keyword: string): void {
    if (keyword.length === 0 || keyword.length > 79) {
        throw new Error("PNG text keyword must contain between 1 and 79 characters");
    }

    for (const character of keyword) {
        const code = character.charCodeAt(0);
        if (code < 32 || code > 126) {
            throw new Error("PNG text keyword must contain printable ASCII characters only");
        }
    }
}

function asciiToBytes(text: string): Uint8Array {
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
        bytes[i] = text.charCodeAt(i);
    }
    return bytes;
}

function bytesToAscii(bytes: Uint8Array): string {
    let text = "";
    for (const byte of bytes) {
        text += String.fromCharCode(byte);
    }
    return text;
}

function readUint32(bytes: Uint8Array, offset: number): number {
    const byte0 = bytes[offset];
    const byte1 = bytes[offset + 1];
    const byte2 = bytes[offset + 2];
    const byte3 = bytes[offset + 3];

    if (byte0 === undefined || byte1 === undefined || byte2 === undefined || byte3 === undefined) {
        throw new Error("Invalid PNG: unexpected end of file");
    }

    return ((byte0 << 24) | (byte1 << 16) | (byte2 << 8) | byte3) >>> 0;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
    bytes[offset] = (value >>> 24) & 0xff;
    bytes[offset + 1] = (value >>> 16) & 0xff;
    bytes[offset + 2] = (value >>> 8) & 0xff;
    bytes[offset + 3] = value & 0xff;
}

function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;

    for (const byte of bytes) {
        crc ^= byte;
        for (let i = 0; i < 8; i++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
    }

    return (crc ^ 0xffffffff) >>> 0;
}
