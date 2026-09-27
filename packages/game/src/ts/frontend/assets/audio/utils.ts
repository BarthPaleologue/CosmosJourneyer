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

import { CreateSoundAsync, CreateStreamingSoundAsync } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import type { AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import type { IStaticSoundOptions, StaticSound } from "@babylonjs/core/AudioV2/abstractAudio/staticSound";
import type { IStreamingSoundOptions, StreamingSound } from "@babylonjs/core/AudioV2/abstractAudio/streamingSound";

import type { ILoadingProgressMonitor } from "../loadingProgressMonitor";

export async function loadStreamingSoundAsync(
    name: string,
    url: string,
    engine: AudioEngineV2,
    progressMonitor: ILoadingProgressMonitor,
    options?: Partial<IStreamingSoundOptions>,
): Promise<StreamingSound> {
    progressMonitor.startTask();
    const sound = await CreateStreamingSoundAsync(name, url, options, engine);
    progressMonitor.completeTask();
    return sound;
}

export async function loadStaticSoundAsync(
    name: string,
    url: string,
    engine: AudioEngineV2,
    progressMonitor: ILoadingProgressMonitor,
    options?: Partial<IStaticSoundOptions>,
): Promise<StaticSound> {
    progressMonitor.startTask();
    const sound = await CreateSoundAsync(name, url, options, engine);
    progressMonitor.completeTask();
    return sound;
}
