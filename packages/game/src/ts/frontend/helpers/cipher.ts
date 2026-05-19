//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { assertUnreachable, err, ok, type Result } from "@/utils/types";

export type EncryptedCodePayloadV1 = {
    version: 1;
    algorithm: "AES-256-GCM";
    kdf: "PBKDF2-HMAC-SHA256";
    iterations: 600_000;
    saltBase64: string;
    ivBase64: string;
    ciphertextBase64: string;
};

export type EncryptedCodePayload = EncryptedCodePayloadV1;

export async function decryptFunction<T extends (...args: never[]) => unknown>(
    payload: EncryptedCodePayload,
    passphrase: string,
): Promise<Result<T, Error>> {
    const decryptionResult = await decryptCodeSource(payload, passphrase);
    if (!decryptionResult.success) {
        return decryptionResult;
    }

    try {
        const evaluated: unknown = (0, eval)(`(${decryptionResult.value})`);
        if (typeof evaluated !== "function") {
            return err(new Error("Decrypted source did not evaluate to a function."));
        }
        return ok(evaluated as T);
    } catch (error) {
        if (error instanceof Error) {
            return err(error);
        } else {
            return err(new Error("Failed to evaluate decrypted function source."));
        }
    }
}

export async function encryptFunction(
    func: (...args: never[]) => unknown,
    passphrase: string,
): Promise<EncryptedCodePayload> {
    const sourceCode = func.toString();
    return encryptCodeSourceV1(sourceCode, passphrase);
}
async function encryptCodeSourceV1(sourceCode: string, passphrase: string): Promise<EncryptedCodePayloadV1> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const iterations = 600_000;

    const key = await deriveAesKey(passphrase, salt, iterations, ["encrypt"]);

    const textEncoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv,
            tagLength: 128,
        },
        key,
        textEncoder.encode(sourceCode),
    );

    return {
        version: 1,
        algorithm: "AES-256-GCM",
        kdf: "PBKDF2-HMAC-SHA256",
        iterations,
        saltBase64: bytesToBase64(salt),
        ivBase64: bytesToBase64(iv),
        ciphertextBase64: bytesToBase64(new Uint8Array(ciphertext)),
    };
}

async function decryptCodeSource(payload: EncryptedCodePayload, passphrase: string): Promise<Result<string, Error>> {
    switch (payload.version) {
        case 1:
            return decryptCodeSourceV1(payload, passphrase);
        default:
            return assertUnreachable(payload.version);
    }
}

async function decryptCodeSourceV1(
    payload: EncryptedCodePayloadV1,
    passphrase: string,
): Promise<Result<string, Error>> {
    try {
        const salt = base64ToBytes(payload.saltBase64);
        const iv = base64ToBytes(payload.ivBase64);
        const ciphertext = base64ToBytes(payload.ciphertextBase64);

        const key = await deriveAesKey(passphrase, salt, payload.iterations, ["decrypt"]);

        const plaintext = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv,
                tagLength: 128,
            },
            key,
            ciphertext,
        );

        const textDecoder = new TextDecoder();
        return ok(textDecoder.decode(plaintext));
    } catch (error) {
        if (error instanceof Error) {
            return err(error);
        } else {
            return err(new Error("Decryption failed with an unknown error."));
        }
    }
}

async function deriveAesKey(
    passphrase: string,
    salt: Uint8Array<ArrayBuffer>,
    iterations: number,
    usages: KeyUsage[],
): Promise<CryptoKey> {
    const textEncoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", textEncoder.encode(passphrase), "PBKDF2", false, [
        "deriveKey",
    ]);

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            hash: "SHA-256",
            salt,
            iterations,
        },
        keyMaterial,
        {
            name: "AES-GCM",
            length: 256,
        },
        false,
        usages,
    );
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function base64ToBytes(base64: string) {
    const binary = atob(base64);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
