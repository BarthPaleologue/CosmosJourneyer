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

import type AxisComposite from "@brianchirls/game-input/controls/AxisComposite";
import type DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import type { Result } from "@cosmos-journeyer/typescript";

import { safeParseSave } from "@/backend/save/saveFileData";
import type { Save } from "@/backend/save/saveFileData";
import type { SaveLoadingError } from "@/backend/save/saveLoadingError";
import type { UniverseBackend } from "@/backend/universe/universeBackend";

import {
    axisCompositeToString,
    dPadCompositeToString,
    pressInteractionToStrings,
} from "@/frontend/helpers/inputControlsString";
import { GeneralInputs } from "@/frontend/inputs/generalInputs";
import { StarSystemInputs } from "@/frontend/inputs/starSystemInputs";
import { StarMapInputs } from "@/frontend/starmap/starMapInputs";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";
import { escapeMarkdown, renderMarkdownBlock, renderMarkdownInline } from "@/utils/markdown";

import i18n from "@/i18n";

import { TutorialControlsInputs } from "../tutorialLayerInputs";
import type { Tutorial } from "./tutorial";

import controlsImgSrc from "@assets/tutorials/starMapTutorial/controls.webp";
import coverImgSrc from "@assets/tutorials/starMapTutorial/cover.webp";
import jumpImgSrc from "@assets/tutorials/starMapTutorial/jump.webp";
import missionImgSrc from "@assets/tutorials/starMapTutorial/mission.webp";
import openImgSrc from "@assets/tutorials/starMapTutorial/open.webp";
import plotItineraryImgSrc from "@assets/tutorials/starMapTutorial/plotItinerary.webp";
import saveData from "@assets/tutorials/starMapTutorial/save.json";

export class StarMapTutorial implements Tutorial {
    readonly coverImageSrc: string = coverImgSrc;

    getSaveData(universeBackend: UniverseBackend): Result<Save, SaveLoadingError> {
        return safeParseSave(saveData, universeBackend);
    }

    getTitle(): string {
        return i18n.t("tutorials:starMap:title");
    }

    getDescription(): string {
        return i18n.t("tutorials:starMap:description");
    }

    async getContentPanelsHtml(): Promise<string[]> {
        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
        const welcomePanelHtml = `
        <div class="tutorialContent">
            <img src="${coverImgSrc}" alt="Welcome to Cosmos Journeyer">
            <p>${i18n.t("tutorials:starMap:welcome")}</p>
            
            ${renderMarkdownBlock(
                i18n.t("tutorials:common:navigationInfo", {
                    // Interpolations are controlled display labels produced by the input binding API.
                    nextKeys: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                        ` ${i18n.t("common:or")} `,
                    ),
                    previousKeys: pressInteractionToStrings(
                        TutorialControlsInputs.map.prevPanel,
                        keyboardLayoutMap,
                    ).join(` ${i18n.t("common:or")} `),
                }),
            )}
        </div>`;

        const toggleStarMapKeys = pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayoutMap).join(
            ` ${i18n.t("common:or")} `,
        );

        const howToOpenPanelHtml = `
        <div class="tutorialContent">
            <p>${i18n.t("tutorials:starMap:open1")}</p>
            <p>${renderMarkdownInline(i18n.t("tutorials:starMap:open2", { keys: escapeMarkdown(toggleStarMapKeys) }))}</p>
            <img src="${openImgSrc}" alt="Star map opening" class="tutorialImage">
            <p>${i18n.t("tutorials:starMap:open3")}</p>
        </div>`;

        const horizontalKeys = dPadCompositeToString(
            StarMapInputs.map.move.bindings[0]?.control as DPadComposite,
            keyboardLayoutMap,
        );
        const verticalKeys = axisCompositeToString(
            StarMapInputs.map.upDown.bindings[0]?.control as AxisComposite,
            keyboardLayoutMap,
        );
        const rawKeys = horizontalKeys.concat(verticalKeys);

        const keys = rawKeys.map((key) => key[1].replace("Key", "")).join(", ");

        const howToUseStarMapPanelHtml = `
        <div class="tutorialContent">
            <p>${renderMarkdownInline(i18n.t("tutorials:starMap:controls1", { keys: escapeMarkdown(keys) }))}</p>
            <img src="${controlsImgSrc}" alt="Star map controls" class="tutorialImage">
            <p>${i18n.t("tutorials:starMap:controls2")}</p>
        </div>`;

        const howToMissionsPanelHtml = `
        <div class="tutorialContent">
            <p>${i18n.t("tutorials:starMap:missions1")}</p>
            <img src="${missionImgSrc}" alt="Star map missions" class="tutorialImage">
            <p>${i18n.t("tutorials:starMap:missions2")}</p>
        </div>`;

        const howToInteractWithSystemPanelHtml = `
        <div class="tutorialContent">
            <p>${i18n.t("tutorials:starMap:system1")}</p>
            <p>${i18n.t("tutorials:starMap:system2")}</p>
            <img src="${plotItineraryImgSrc}" alt="Star map system interactions" class="tutorialImage">
            <p>${i18n.t("tutorials:starMap:system3")}</p>
        </div>`;

        const jumpKeys = pressInteractionToStrings(StarSystemInputs.map.jumpToSystem, keyboardLayoutMap).join(
            ` ${i18n.t("common:or")} `,
        );

        const howToInterstellarTravelPanelHtml = `
        <div class="tutorialContent">
            <p>${i18n.t("tutorials:starMap:travel1")}</p>
            <p>${renderMarkdownInline(i18n.t("tutorials:starMap:travel2", { keys: escapeMarkdown(jumpKeys) }))}</p>
            <img src="${jumpImgSrc}" alt="Interstellar jump" class="tutorialImage">
            <p>${i18n.t("tutorials:starMap:travel3")}</p>
        </div>`;

        const endPanelHtml = `
        <div class="tutorialContent">
            <img src="${coverImgSrc}" alt="Welcome to Cosmos Journeyer">
            <p>${i18n.t("tutorials:starMap:congratulations")}</p>
            ${renderMarkdownBlock(
                i18n.t("tutorials:common:tutorialEnding", {
                    // Key labels come from the controlled input binding display API; escape them before Markdown interpolation.
                    keyQuit: escapeMarkdown(
                        pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                            ` ${i18n.t("common:or")} `,
                        ),
                    ),
                }),
            )}
        </div>`;

        return [
            welcomePanelHtml,
            howToOpenPanelHtml,
            howToUseStarMapPanelHtml,
            howToMissionsPanelHtml,
            howToInteractWithSystemPanelHtml,
            howToInterstellarTravelPanelHtml,
            endPanelHtml,
        ];
    }
}
