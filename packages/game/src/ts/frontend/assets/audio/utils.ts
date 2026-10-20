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

/**
 * Creates a streamed sound from a URL and marks its loading task complete.
 * @param name Label shown for the sound in the audio engine.
 * @param url Source URL for the audio stream.
 * @param engine Audio engine that owns the new sound.
 * @param progressMonitor Tracks completion of this sound-loading task.
 * @param options Playback and streaming settings passed to Babylon's audio engine.
 * @returns A sound that streams audio instead of loading the full clip up front.
 */
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

/**
 * Decodes a sound clip from a URL and marks its loading task complete.
 * @param name Label shown for the sound in the audio engine.
 * @param url Source URL for the audio clip.
 * @param engine Audio engine that owns the new sound.
 * @param progressMonitor Tracks completion of this sound-loading task.
 * @param options Playback settings passed to Babylon's audio engine.
 * @returns A decoded clip ready for playback without streaming.
 */
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
