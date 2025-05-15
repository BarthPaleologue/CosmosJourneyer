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

import { loadMusics, Musics } from "./musics";
import { loadSounds, Sounds } from "./sounds";
import { loadVoiceLines, SpeakerVoiceLines } from "./voiceLines";

export type AudioAssets = {
    readonly sounds: Sounds;
    readonly musics: Musics;
    readonly speakerVoiceLines: SpeakerVoiceLines;
};

export async function loadAudioAssets(
    progressCallback: (loadedCount: number, totalCount: number, lastItemName: string) => void,
): Promise<AudioAssets> {
    const soundsPromise = loadSounds(progressCallback);
    const musicsPromise = loadMusics(progressCallback);
    const voiceLinesPromise = loadVoiceLines(progressCallback);

    return {
        sounds: await soundsPromise,
        musics: await musicsPromise,
        speakerVoiceLines: await voiceLinesPromise,
    };
}
