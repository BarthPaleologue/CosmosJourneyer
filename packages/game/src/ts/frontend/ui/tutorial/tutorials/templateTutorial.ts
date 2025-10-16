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
import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { pressInteractionToStrings } from "@/frontend/helpers/inputControlsString";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";
import { type Result } from "@/utils/types";

import i18n from "@/i18n";

import { TutorialControlsInputs } from "../tutorialLayerInputs";
import { type Tutorial } from "./tutorial";

import saveData from "@assets/tutorials/flightTutorial/save.json";
import welcomeImageSrc from "@assets/tutorials/flightTutorial/welcome.webp";

export class TemplateTutorial implements Tutorial {
    readonly coverImageSrc: string = welcomeImageSrc;

    getSaveData(universeBackend: UniverseBackend): Result<Save, SaveLoadingError> {
        return safeParseSave(saveData, universeBackend);
    }

    getTitle() {
        return "Template Tutorial";
    }

    getDescription() {
        return "This is a template tutorial to help building more tutorials!";
    }

    async getContentPanelsHtml(): Promise<string[]> {
        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
        const welcomePanelHtml = `
        <div class="tutorialContent">
            <img src="${welcomeImageSrc}" alt="Welcome to Cosmos Journeyer">
            <p>Welcome, Commander! This is a tutorial about tutorials! Now this is meta.</p>
            
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

        const endPanelHtml = `
        <div class="tutorialContent">
            ${i18n.t("tutorials:common:tutorialEnding", {
                // This displays a small internationalized text to explain the keys to end the tutorial
                keyQuit: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `,
                ),
            })}
        </div>`;

        return [welcomePanelHtml, endPanelHtml];
    }
}
