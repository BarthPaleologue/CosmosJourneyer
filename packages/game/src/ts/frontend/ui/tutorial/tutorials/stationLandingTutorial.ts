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

import type { Result } from "@cosmos-journeyer/typescript";
import type { TFunction } from "i18next";

import { safeParseSave } from "@/backend/save/saveFileData";
import type { Save } from "@/backend/save/saveFileData";
import type { SaveLoadingError } from "@/backend/save/saveLoadingError";
import type { UniverseBackend } from "@/backend/universe/universeBackend";

import { pressInteractionToStrings } from "@/frontend/helpers/inputControlsString";
import { SpaceShipControlsInputs } from "@/frontend/spaceship/spaceShipControlsInputs";
import { TutorialControlsInputs } from "@/frontend/ui/tutorial/tutorialLayerInputs";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";
import { renderMarkdownBlock } from "@/utils/markdown";

import type { Tutorial } from "./tutorial";

import saveData from "@assets/tutorials/stationLandingTutorial/save.json";
import station1ImageSrc from "@assets/tutorials/stationLandingTutorial/station1.webp";
import stationLandingBayImageSrc from "@assets/tutorials/stationLandingTutorial/stationLandingBay.webp";
import stationPadApproachImageSrc from "@assets/tutorials/stationLandingTutorial/stationPadApproach.webp";
import stationServicesImageSrc from "@assets/tutorials/stationLandingTutorial/stationServices.webp";

export class StationLandingTutorial implements Tutorial {
    readonly coverImageSrc: string = station1ImageSrc;

    private readonly t: TFunction;

    constructor(t: TFunction) {
        this.t = t;
    }

    getSaveData(universeBackend: UniverseBackend): Result<Save, SaveLoadingError> {
        return safeParseSave(saveData, universeBackend);
    }

    getTitle(): string {
        return this.t("tutorials:stationLanding:title");
    }

    getDescription(): string {
        return this.t("tutorials:stationLanding:description");
    }

    async getContentPanelsHtml(): Promise<string[]> {
        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
        const presentationPanelHtml = `
        <div class="tutorialContent">
            <img src="${station1ImageSrc}" alt="Space Station">
            <p>${this.t("tutorials:stationLanding:welcome")}</p>
            
            <p>${this.t("tutorials:stationLanding:whatAreStations")}</p>
            
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

        const landingRequestPanelHtml = `
        <div class="tutorialContent">
            <img src="${stationLandingBayImageSrc}" alt="Space Station's landing bay">
            
            <p>${this.t("tutorials:stationLanding:whereLandingBay")}</p>
            
            <p>${this.t("tutorials:stationLanding:landingRequest", {
                keys: pressInteractionToStrings(SpaceShipControlsInputs.map.emitLandingRequest, keyboardLayoutMap).join(
                    ` ${this.t("common:or")} `,
                ),
            })}</p>
            
        </div>`;

        const landingPanelHtml = `
        <div class="tutorialContent">
            <img src="${stationPadApproachImageSrc}" alt="Space Station">    
            <p>${this.t("tutorials:stationLanding:requestAccepted")}</p>
        
            <p>${this.t("tutorials:stationLanding:beCareful")}</p>
            
            <p>${this.t("tutorials:stationLanding:autoLanding")}</p>
        </div>`;

        const stationServicesPanelHtml = `
        <div class="tutorialContent">
            <img src="${stationServicesImageSrc}" alt="Space Station">
            
            <p>${this.t("tutorials:stationLanding:services1")}</p>
            
            <p>${this.t("tutorials:stationLanding:services2")}</p>
            
            ${renderMarkdownBlock(
                this.t("tutorials:common:tutorialEnding", {
                    // Interpolations are controlled display labels produced by the input binding API.
                    keyQuit: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                        ` ${this.t("common:or")} `,
                    ),
                }),
            )}
        </div>`;

        return [presentationPanelHtml, landingRequestPanelHtml, landingPanelHtml, stationServicesPanelHtml];
    }
}
