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

import { FreeCamera, HemisphericLight, MeshBuilder, Scene, Vector3, type AbstractEngine } from "@babylonjs/core";
import * as BABYLON from "@babylonjs/core";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { decryptFunction } from "@/frontend/helpers/cipher";
import { alertModal, promptModalString } from "@/frontend/ui/dialogModal";

import { initI18n } from "@/i18n";

import { addToWindow } from "./utils";

export async function createCryptographicSecretScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine);

    const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl();

    const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    sphere.position.y = 1;

    MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

    // Secret code side effects must go through the global scope, hence adding BABYLON here. In the full game, the secret would use the global CosmosJourneyer object instead.
    addToWindow("BABYLON", BABYLON);

    /*const encryptionPassphrase = "secret";
    console.log(encryptionPassphrase);

    const secretFunction = () => {
        console.log("Congratulations! You've found the secret function!");

        const scene = BABYLON.Engine.LastCreatedScene;
        if (scene === null) {
            console.log("But it seems like the scene is not available... Strange!");
            return;
        }

        scene.onBeforeRenderObservable.add(() => {
            const sphere = BABYLON.Engine.LastCreatedScene?.getMeshByName("sphere");
            if (sphere === null || sphere === undefined) {
                return;
            }

            sphere.position.x = Math.sin(Date.now() * 0.001) * 2;
        });
    };

    const payload = await encryptFunction(secretFunction, encryptionPassphrase);
    console.log(JSON.stringify(payload));*/

    const payload = {
        version: 1,
        algorithm: "AES-256-GCM",
        kdf: "PBKDF2-HMAC-SHA256",
        iterations: 600000,
        saltBase64: "nMmfRxCPXobiMZBPoeN52Q==",
        ivBase64: "a9OHpdsmakhMjKs5",
        ciphertextBase64:
            "HpufwJTTwHQpYXgkOtmEaFMgNnLyzfE0LcSQZHkn8qnTUenrAn+x44nqprHP/4OyYt7Tk0NC7FNsBqWCcTFPgGH9KTU2khftLxjop1t1JgtVC6QfwhLCuowLus8T16IxvAJLhIZGxSv2rwwPKKY0lLohPi4mDi6XS/oG2IHDdLHpIMrwuRD+310WfpjWnvUR9brugSx/IpWTSNM+tVkMfjGGFe+++pKQ3Tnt42LehaK5l95Xshx1u2yn77v0+NpcB+8qQsdkRPEBItGQSqkJoOg3FR0eKliz3vwNropaxTb6a8puewVeYJ2oxgeq+DUPKkpKYF/XJvFEWtw9GO5/7uphuUE/K8jV4UQfm4hcZt76euIULLxgkWK05qogevwrKcdeMye79tROVUB75rgTNBxtzHa8Mvl+c0T71j78Dz7MTeQfmrcsvIlhBhKuOiAkpysTSX4tTY7Z3CIJstbjZ6sz/cVAz2LEawVboGCqP1Gz3VmuzWyPHE5ybblALjBXYv1WYOXxyMVMPe+GHAJcA86k4shVx9sSBB9chmao17/qSQhsvQhlm8LOwagZSiHEPyERsAeu0osk8FTcIuqQymU3kMPiCY6sAgtpkZAN0PLOSBp+CDKdOdu8eF9xFh03QY/8dWkhkR/BgQ/S3J2RnSXdVHl9Z7lDMZ0fII8=",
    } as const;

    const soundPlayerMock = new SoundPlayerMock();

    await initI18n();

    void promptModalString("Enter the decryption passphrase to reveal the secret function:", "", soundPlayerMock).then(
        async (decryptionPassphrase) => {
            if (decryptionPassphrase === null) {
                await alertModal("Decryption cancelled.", soundPlayerMock);
                return;
            }

            const decryptedFunctionResult = await decryptFunction<() => void>(payload, decryptionPassphrase);
            if (!decryptedFunctionResult.success) {
                await alertModal(
                    "Decryption Failed: The provided passphrase was incorrect, or an error occurred during decryption.",
                    soundPlayerMock,
                );
                return;
            }

            decryptedFunctionResult.value();
        },
    );

    return scene;
}
