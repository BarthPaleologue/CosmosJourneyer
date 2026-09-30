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

import { loadStaticSoundAsync, loadStreamingSoundAsync } from "@/frontend/assets/audio/utils";
import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";

import type { AssetsExtensionPoint } from "./assets";

type AssetExtensions = {
    musics: Map<string, StreamingSound>;
    sounds: Map<string, StaticSound>;
};

export type AudioAssetContext = AssetContext & {
    readonly audioEngine: AudioEngineV2;
};

export type AssetContext = {
    readonly progressMonitor: ILoadingProgressMonitor;
};

export class ModuleAssetRegistry implements AssetsExtensionPoint {
    private readonly musics = new AssetRegistry<AudioAssetContext, StreamingSound>(async (url, context) =>
        loadStreamingSoundAsync(url, url, context.audioEngine, context.progressMonitor),
    );
    private readonly sounds = new AssetRegistry<AudioAssetContext, StaticSound>(async (url, context) =>
        loadStaticSoundAsync(url, url, context.audioEngine, context.progressMonitor),
    );

    registerMusic(id: string, url: string): void {
        this.musics.register(id, url);
    }
    registerSound(id: string, url: string): void {
        this.sounds.register(id, url);
    }

    async load(audioContext: AudioAssetContext): Promise<AssetExtensions> {
        const musicsPromise = this.musics.load(audioContext);
        const soundsPromise = this.sounds.load(audioContext);

        const [musics, sounds] = await Promise.all([musicsPromise, soundsPromise]);

        return { musics, sounds };
    }
}

export type AssetLoader<TContext, TOutput> = (url: string, context: TContext) => Promise<TOutput>;

class AssetRegistry<TContext, TOutput> {
    private readonly registry: Map<string, string> = new Map();

    private readonly loader: AssetLoader<TContext, TOutput>;

    constructor(loader: AssetLoader<TContext, TOutput>) {
        this.loader = loader;
    }

    register(id: string, url: string): void {
        this.registry.set(id, url);
    }

    async load(context: TContext): Promise<Map<string, TOutput>> {
        const pending = new Map<string, Promise<TOutput>>();
        for (const [id, url] of this.registry) {
            pending.set(id, this.loader(url, context));
        }

        const results = new Map<string, TOutput>();
        for (const [id, promise] of pending) {
            results.set(id, await promise);
        }

        return results;
    }
}
