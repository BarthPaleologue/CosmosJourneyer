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
import {
    axisCompositeToString,
    dPadCompositeToString,
    pressInteractionToStrings
} from "../utils/strings/inputControlsString";
import { Tutorial } from "./tutorial";
import coverImgSrc from "../../asset/tutorials/starMapTutorial/cover.webp";
import saveData from "../../asset/tutorials/flightTutorial/save.json";
import i18n from "../i18n";
import { getGlobalKeyboardLayoutMap } from "../utils/keyboardAPI";
import { safeParseSave, Save } from "../saveFile/saveFileData";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { Result } from "../utils/types";
import { SaveLoadingError } from "../saveFile/saveLoadingError";
import { StarMapInputs } from "../starmap/starMapInputs";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import { GeneralInputs } from "../inputs/generalInputs";
import AxisComposite from "@brianchirls/game-input/controls/AxisComposite";
import { StarSystemInputs } from "../inputs/starSystemInputs";

export class StarMapTutorial implements Tutorial {
    readonly coverImageSrc: string = coverImgSrc;

    getSaveData(starSystemDatabase: StarSystemDatabase): Result<Save, SaveLoadingError> {
        return safeParseSave(saveData, starSystemDatabase);
    }

    getTitle() {
        return "Star map Tutorial";
    }

    getDescription() {
        return "Learn how to use the star map.";
    }

    async getContentPanelsHtml(): Promise<string[]> {
        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
        const welcomePanelHtml = `
        <div class="tutorialContent">
            <img src="${coverImgSrc}" alt="Welcome to Cosmos Journeyer">
            <p>This tutorial will teach you how to use the star map to master interstellar travel.</p>
            
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

        const toggleStarMapKeys = pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayoutMap).join(
            ` ${i18n.t("common:or")} `
        );

        const howToOpenPanelHtml = `
        <div class="tutorialContent">
            <p>Finding your way among the stars is not trivial without a map.</p> 
            <p>To open the star map, press <strong>${toggleStarMapKeys}</strong>.</p> 
            <p>Pressing the same key again will close the star map.</p>
        </div>`;

        const horizontalKeys = dPadCompositeToString(
            StarMapInputs.map.move.bindings[0].control as DPadComposite,
            keyboardLayoutMap
        );
        const verticalKeys = axisCompositeToString(
            StarMapInputs.map.upDown.bindings[0].control as AxisComposite,
            keyboardLayoutMap
        );
        const rawKeys = horizontalKeys.concat(verticalKeys);

        const keys = rawKeys.map((key) => key[1].replace("Key", "")).join(", ");

        const howToUseStarMapPanelHtml = `
        <div class="tutorialContent">
            <p>Once the star map is open, you can use the mouse to move the camera around the center of the view. To translate the center of the view, use <strong>${keys}</strong>.</p>
            <p>You can zoom with the mouse wheel, and nearby stars can be selected by clicking on them.</p>
        </div>`;

        const howToMissionsPanelHtml = `
        <div class="tutorialContent">
            <p>If you have taken missions, you will find your destinations thanks to the orange icons on the map.</p>
            <p>You can click on the icon to target the system</p>
        </div>`;

        const howToInteractWithSystemPanelHtml = `
        <div class="tutorialContent">
            <p>Once you have selected a system, its infos will be displayed on the left of the screen.</p>
            <p>You can add it to your bookmarks by clicking the "Bookmark" button.</p>
            <p>To plot an itinerary, click on the "Plot itinerary" button. This will create a sequence of interstellar jumps for you to follow</p>
        </div>`;

        const jumpKeys = pressInteractionToStrings(StarSystemInputs.map.jumpToSystem, keyboardLayoutMap).join(
            ` ${i18n.t("common:or")} `
        );

        const howToInterstellarTravelPanelHtml = `
        <div class="tutorialContent">
            <p>To follow your itinerary, close the star map and align your ship with your target.</p>
            <p>Once aligned, press <strong>${jumpKeys}</strong> to warp to the system.</p>
            <p>You can repeat this process until you reach your destination.</p>
        </div>`;

        const endPanelHtml = `
        <div class="tutorialContent">
            <p>Congratulations! You now know how to use the star map. I hope you will find it useful in your interstellar adventures!</p>
            ${i18n.t("tutorials:common:tutorialEnding", {
                // This displays a small internationalized text to explain the keys to end the tutorial
                keyQuit: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `
                )
            })}
        </div>`;

        return [
            welcomePanelHtml,
            howToOpenPanelHtml,
            howToUseStarMapPanelHtml,
            howToMissionsPanelHtml,
            howToInteractWithSystemPanelHtml,
            howToInterstellarTravelPanelHtml,
            endPanelHtml
        ];
    }
}
