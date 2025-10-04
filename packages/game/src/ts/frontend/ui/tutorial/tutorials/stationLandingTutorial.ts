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

import { safeParseSave, type Save } from "@/backend/save/saveFileData";
import { type SaveLoadingError } from "@/backend/save/saveLoadingError";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { pressInteractionToStrings } from "@/frontend/helpers/inputControlsString";
import { SpaceShipControlsInputs } from "@/frontend/spaceship/spaceShipControlsInputs";
import { TutorialControlsInputs } from "@/frontend/ui/tutorial/tutorialLayerInputs";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";
import { type Result } from "@/utils/types";

import i18n from "@/i18n";

import { type Tutorial } from "./tutorial";

import saveData from "@assets/tutorials/stationLandingTutorial/save.json";
import station1ImageSrc from "@assets/tutorials/stationLandingTutorial/station1.webp";
import stationLandingBayImageSrc from "@assets/tutorials/stationLandingTutorial/stationLandingBay.webp";
import stationPadApproachImageSrc from "@assets/tutorials/stationLandingTutorial/stationPadApproach.webp";
import stationServicesImageSrc from "@assets/tutorials/stationLandingTutorial/stationServices.webp";

export class StationLandingTutorial implements Tutorial {
    readonly coverImageSrc: string = station1ImageSrc;

    getSaveData(starSystemDatabase: StarSystemDatabase): Result<Save, SaveLoadingError> {
        return safeParseSave(saveData, starSystemDatabase);
    }

    getTitle() {
        return i18n.t("tutorials:stationLanding:title");
    }

    getDescription() {
        return i18n.t("tutorials:stationLanding:description");
    }

    async getContentPanelsHtml(): Promise<string[]> {
        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
        const presentationPanelHtml = `
        <div class="tutorialContent">
            <img src="${station1ImageSrc}" alt="Space Station">
            <p>${i18n.t("tutorials:stationLanding:welcome")}</p>
            
            <p>${i18n.t("tutorials:stationLanding:whatAreStations")}</p>
            
            ${i18n.t("tutorials:common:navigationInfo", {
                // This displays a small internationalized text to explain the keys to navigate the tutorial
                nextKeys: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `,
                ),
                previousKeys: pressInteractionToStrings(TutorialControlsInputs.map.prevPanel, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `,
                ),
            })}
        </div>`;

        const landingRequestPanelHtml = `
        <div class="tutorialContent">
            <img src="${stationLandingBayImageSrc}" alt="Space Station's landing bay">
            
            <p>${i18n.t("tutorials:stationLanding:whereLandingBay")}</p>
            
            <p>${i18n.t("tutorials:stationLanding:landingRequest", {
                keys: pressInteractionToStrings(SpaceShipControlsInputs.map.emitLandingRequest, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `,
                ),
            })}</p>
            
        </div>`;

        const landingPanelHtml = `
        <div class="tutorialContent">
            <img src="${stationPadApproachImageSrc}" alt="Space Station">    
            <p>${i18n.t("tutorials:stationLanding:requestAccepted")}</p>
        
            <p>${i18n.t("tutorials:stationLanding:beCareful")}</p>
            
            <p>${i18n.t("tutorials:stationLanding:autoLanding")}</p>
        </div>`;

        const stationServicesPanelHtml = `
        <div class="tutorialContent">
            <img src="${stationServicesImageSrc}" alt="Space Station">
            
            <p>${i18n.t("tutorials:stationLanding:services1")}</p>
            
            <p>${i18n.t("tutorials:stationLanding:services2")}</p>
            
            <p>${i18n.t("tutorials:common:tutorialEnding", {
                // This displays a small internationalized text to explain the keys to end the tutorial
                keyQuit: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `,
                ),
            })}
                </p>
        </div>`;

        return [presentationPanelHtml, landingRequestPanelHtml, landingPanelHtml, stationServicesPanelHtml];
    }
}
