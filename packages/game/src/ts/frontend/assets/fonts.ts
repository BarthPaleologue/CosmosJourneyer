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

import type { ILoadingProgressMonitor } from "./loadingProgressMonitor";

import caveatFontUrl from "@assets/fonts/Caveat/Caveat-VariableFont_wght.ttf?url";

export type Fonts = {
    caveat: FontFace;
};

export async function loadFonts(progressMonitor: ILoadingProgressMonitor): Promise<Fonts> {
    const caveatPromise = loadFont(
        new FontFace("Caveat", getFontSource(caveatFontUrl), {
            weight: "400 700",
        }),
        progressMonitor,
    );

    return {
        caveat: await caveatPromise,
    };
}

function getFontSource(fontUrl: string) {
    return `url("${fontUrl}")`;
}

async function loadFont(fontFace: FontFace, progressMonitor: ILoadingProgressMonitor) {
    progressMonitor.startTask();
    const font = await fontFace.load();
    document.fonts.add(font);
    progressMonitor.completeTask();

    return font;
}
