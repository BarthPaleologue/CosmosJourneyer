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

import { TutorialControlsInputs } from "../ui/tutorial/tutorialLayerInputs";
import { pressInteractionToStrings } from "../utils/strings/inputControlsString";
import { Tutorial } from "./tutorial";
import welcomeImageSrc from "../../asset/tutorials/fuelScoopTutorial/fuelScoop.webp";
import fuelIconLocation from "../../asset/tutorials/fuelScoopTutorial/fuelIconLocation.webp";
import howToFuelScoop from "../../asset/tutorials/fuelScoopTutorial/howToFuelScoop.webp";
import saveData from "../../asset/tutorials/fuelScoopTutorial/save.json";
import i18n from "../i18n";
import { getGlobalKeyboardLayoutMap } from "../utils/keyboardAPI";
import { safeParseSave, Save } from "../saveFile/saveFileData";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";

export class FuelScoopTutorial implements Tutorial {
    saveData: Save;
    coverImageSrc = welcomeImageSrc;

    constructor(starSystemDatabase: StarSystemDatabase) {
        const parsedSaveDataResult = safeParseSave(saveData, starSystemDatabase);
        if (!parsedSaveDataResult.success) {
            console.error(parsedSaveDataResult.error);
            throw new Error("FuelScoopTutorial: saveData is null");
        }

        this.saveData = parsedSaveDataResult.value;
    }

    getTitle() {
        return i18n.t("tutorials:fuelScooping:title");
    }
    getDescription() {
        return i18n.t("tutorials:fuelScooping:description");
    }
    async getContentPanelsHtml(): Promise<string[]> {
        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
        const presentationPanelHtml = `
        <div class="tutorialContent">
            <img src="${welcomeImageSrc}" alt="Fuel scooping welcome image">
            <p>${i18n.t("tutorials:fuelScooping:welcome")}</p>
            
            <p>${i18n.t("tutorials:fuelScooping:whatIsFuel")}</p>
            
            ${i18n.t("tutorials:common:navigationInfo", {
                // This displays a small internationalized text to explain the keys to navigate the tutorial
                nextKeys: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `
                ),
                previousKeys: pressInteractionToStrings(TutorialControlsInputs.map.prevPanel, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `
                )
            })}
        </div>`;

        const fuelManagement = `
        <div class="tutorialContent">
            <img src="${fuelIconLocation}" alt="Fuel icon location">
            
            <p>${i18n.t("tutorials:fuelScooping:whereFuelIcon")}</p>            
        </div>`;

        const howToFuelScoopPanel = `
        <div class="tutorialContent">
            <img src="${howToFuelScoop}" alt="How to fuel scoop">
            
            <p>${i18n.t("tutorials:fuelScooping:howToFuelScoop")}</p>
            
            <p>${i18n.t("tutorials:common:tutorialEnding", {
                // This displays a small internationalized text to explain the keys to end the tutorial
                keyQuit: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `
                )
            })}
                </p>
        </div>`;

        return [presentationPanelHtml, fuelManagement, howToFuelScoopPanel];
    }
}
