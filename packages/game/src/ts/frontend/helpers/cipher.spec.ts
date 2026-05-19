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

import { beforeAll, describe, expect, it } from "vitest";

import { decryptFunction, encryptFunction, type EncryptedCodePayload } from "./cipher";

describe("cipher", () => {
    const passphrase = "correct horse battery staple";
    let payload: EncryptedCodePayload;

    beforeAll(async () => {
        payload = await encryptFunction(() => {
            return 42;
        }, passphrase);
    });

    it("can decrypt an encrypted function with the original passphrase", async () => {
        const decryptedFunctionResult = await decryptFunction<() => number>(payload, passphrase);

        expect(decryptedFunctionResult.success).toBe(true);
        if (!decryptedFunctionResult.success) {
            return;
        }

        expect(decryptedFunctionResult.value()).toBe(42);
    });

    it("fails to decrypt with the wrong passphrase", async () => {
        const decryptedFunctionResult = await decryptFunction<() => number>(payload, "wrong passphrase");

        expect(decryptedFunctionResult.success).toBe(false);
    });

    it("fails to decrypt tampered ciphertext", async () => {
        const tamperedPayload = {
            ...payload,
            ciphertextBase64: tamperBase64(payload.ciphertextBase64),
        };

        const decryptedFunctionResult = await decryptFunction<() => number>(tamperedPayload, passphrase);

        expect(decryptedFunctionResult.success).toBe(false);
    });
});

function tamperBase64(base64: string): string {
    const firstCharacter = base64.charAt(0);
    const replacementCharacter = firstCharacter === "A" ? "B" : "A";
    return `${replacementCharacter}${base64.slice(1)}`;
}
