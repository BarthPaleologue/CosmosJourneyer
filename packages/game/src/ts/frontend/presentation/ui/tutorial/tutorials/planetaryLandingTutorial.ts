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

import type { AxisComposite } from "@brianchirls/game-input/browser";
import type { Result } from "@cosmos-journeyer/typescript";
import type { TFunction } from "i18next";

import { safeParseSave } from "@/backend/save/saveFileData";
import type { Save } from "@/backend/save/saveFileData";
import type { SaveLoadingError } from "@/backend/save/saveLoadingError";
import type { UniverseBackend } from "@/backend/universe/universeBackend";

import { StarSystemInputs } from "@/frontend/gameplay/inputs/starSystemInputs";
import { SpaceShipControlsInputs } from "@/frontend/gameplay/spaceship/spaceShipControlsInputs";
import { axisCompositeToString, pressInteractionToStrings } from "@/frontend/helpers/inputControlsString";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";
import { renderMarkdownBlock } from "@/utils/markdown";

import { TutorialControlsInputs } from "../tutorialLayerInputs";
import type { Tutorial } from "./tutorial";

import welcomeImageSrc from "@assets/tutorials/planetaryLandingTutorial/cover.webp";
import gettingCloseToSurfaceImageSrc from "@assets/tutorials/planetaryLandingTutorial/gettingCloseToSurface.png";
import landingImageSrc from "@assets/tutorials/planetaryLandingTutorial/landing.webp";
import saveData from "@assets/tutorials/planetaryLandingTutorial/save.json";

function getSpaceshipUpKeys(keyboardLayoutMap: Map<string, string> | null, t: TFunction): string {
    const upDownBinding = SpaceShipControlsInputs.map.upDown.bindings[0];
    if (upDownBinding === undefined) {
        throw new Error("Spaceship up/down controls are missing");
    }

    return axisCompositeToString(upDownBinding.control as AxisComposite, keyboardLayoutMap)
        .filter(([direction]) => direction === "positive")
        .map(([, key]) => key)
        .join(` ${t("common:or")} `);
}

export class PlanetaryLandingTutorial implements Tutorial {
    readonly coverImageSrc: string = welcomeImageSrc;

    private readonly t: TFunction;

    constructor(t: TFunction) {
        this.t = t;
    }

    getSaveData(universeBackend: UniverseBackend): Result<Save, SaveLoadingError> {
        return safeParseSave(saveData, universeBackend);
    }

    getTitle(): string {
        return this.t("tutorials:planetaryLanding:title");
    }
    getDescription(): string {
        return this.t("tutorials:planetaryLanding:description");
    }
    async getContentPanelsHtml(): Promise<string[]> {
        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
        const spaceshipUpKeys = getSpaceshipUpKeys(keyboardLayoutMap, this.t);

        const presentationPanelHtml = `
        <div class="tutorialContent">
            <img src="${welcomeImageSrc}" alt="Planetary landing welcome image">
            <p>${this.t("tutorials:planetaryLanding:welcome")}</p>
            
            ${renderMarkdownBlock(
                this.t("tutorials:common:navigationInfo", {
                    // Interpolations are controlled display labels produced by the input binding API.
                    nextKeys: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                        ` ${this.t("common:or")} `,
                    ),
                    previousKeys: pressInteractionToStrings(
                        TutorialControlsInputs.map.prevPanel,
                        keyboardLayoutMap,
                    ).join(` ${this.t("common:or")} `),
                }),
            )}
        </div>`;

        const gettingCloseToSurfacePanel = `
        <div class="tutorialContent">
            <img src="${gettingCloseToSurfaceImageSrc}" alt="Getting close to the surface">
            
            <p>${this.t("tutorials:planetaryLanding:gettingCloseToSurface")}</p>
        </div>`;

        const howToLandPanel = `
        <div class="tutorialContent">
            <img src="${landingImageSrc}" alt="Planetary landing">
            
            <p>${this.t("tutorials:planetaryLanding:howToLand", {
                keyLand: pressInteractionToStrings(SpaceShipControlsInputs.map.landing, keyboardLayoutMap).join(
                    ` ${this.t("common:or")} `,
                ),
                keyExit: pressInteractionToStrings(
                    StarSystemInputs.map.toggleSpaceShipCharacter,
                    keyboardLayoutMap,
                ).join(` ${this.t("common:or")} `),
            })}</p>

            <p>${this.t("tutorials:planetaryLanding:howToLiftoff", { keyLiftoff: spaceshipUpKeys })}</p>
            
            ${renderMarkdownBlock(
                this.t("tutorials:common:tutorialEnding", {
                    // Interpolations are controlled display labels produced by the input binding API.
                    keyQuit: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                        ` ${this.t("common:or")} `,
                    ),
                }),
            )}
        </div>`;

        return [presentationPanelHtml, gettingCloseToSurfacePanel, howToLandPanel];
    }
}
