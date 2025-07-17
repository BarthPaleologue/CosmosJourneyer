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

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadMusics, type Musics } from "./musics";
import { loadSounds, type Sounds } from "./sounds";
import { loadVoiceLines, type SpeakerVoiceLines } from "./voiceLines";

export type AudioAssets = {
    readonly sounds: Sounds;
    readonly musics: Musics;
    readonly speakerVoiceLines: SpeakerVoiceLines;
};

export async function loadAudioAssets(progressMonitor: ILoadingProgressMonitor | null): Promise<AudioAssets> {
    const soundsPromise = loadSounds(progressMonitor);
    const musicsPromise = loadMusics(progressMonitor);
    const voiceLinesPromise = loadVoiceLines(progressMonitor);

    return {
        sounds: await soundsPromise,
        musics: await musicsPromise,
        speakerVoiceLines: await voiceLinesPromise,
    };
}
