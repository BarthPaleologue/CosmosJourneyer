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

import type { AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import type { StaticSound } from "@babylonjs/core/AudioV2/abstractAudio/staticSound";
import type { StreamingSound } from "@babylonjs/core/AudioV2/abstractAudio/streamingSound";
import { err, ok } from "@cosmos-journeyer/typescript";
import type { Result } from "@cosmos-journeyer/typescript";

import type { ILoadingProgressMonitor } from "../assets/loadingProgressMonitor";

export class AssetsExtensionPoints {
    readonly musics = new AssetExtensionPoint<AudioAssetContext, StreamingSound>();
    readonly sounds = new AssetExtensionPoint<AudioAssetContext, StaticSound>();

    async load(audioContext: AudioAssetContext): Promise<
        Result<
            {
                musics: Map<string, StreamingSound>;
                sounds: Map<string, StaticSound>;
            },
            Error
        >
    > {
        const musicsPromise = this.musics.load(audioContext);
        const soundsPromise = this.sounds.load(audioContext);

        const [musicsResult, soundsResult] = await Promise.all([musicsPromise, soundsPromise]);
        if (!musicsResult.success) {
            return musicsResult;
        }
        if (!soundsResult.success) {
            return soundsResult;
        }

        return ok({
            musics: musicsResult.value,
            sounds: soundsResult.value,
        });
    }
}

type AudioAssetContext = AssetContext & {
    readonly audioEngine: AudioEngineV2;
};

type AssetContext = {
    readonly progressMonitor: ILoadingProgressMonitor;
};

export class AssetExtensionPoint<TContext, TOutput> {
    private readonly registry: Map<string, (context: TContext) => Promise<Result<TOutput, unknown>>> = new Map();

    register(id: string, loader: (context: TContext) => Promise<Result<TOutput, unknown>>): void {
        this.registry.set(id, loader);
    }

    async load(context: TContext): Promise<Result<Map<string, TOutput>, Error>> {
        const pending = new Map<string, Promise<Result<TOutput, unknown>>>();
        for (const [id, loader] of this.registry) {
            pending.set(id, loader(context));
        }

        const results = new Map<string, TOutput>();
        for (const [id, promise] of pending) {
            const result = await promise;
            if (!result.success) {
                return err(new Error(`Could not load ${id}`, { cause: result.error }));
            }

            results.set(id, result.value);
        }

        return ok(results);
    }
}
