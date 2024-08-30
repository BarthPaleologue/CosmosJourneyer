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

import { SpaceShipControlsInputs } from "../spaceship/spaceShipControlsInputs";
import { TutorialControlsInputs } from "../ui/tutorial/tutorialLayerInputs";
import { axisCompositeToString, pressInteractionToStrings } from "../utils/inputControlsString";
import { AxisComposite } from "@brianchirls/game-input/browser";
import { Tutorial } from "./tutorial";
import i18n from "../i18n";

import welcomeImageSrc from "../../asset/tutorials/flightTutorial/welcome.webp";
import rotationImageSrc from "../../asset/tutorials/flightTutorial/rotation.webp";
import thrustImageSrc from "../../asset/tutorials/flightTutorial/thrust.webp";
import warpImageSrc from "../../asset/tutorials/flightTutorial/warp.webp";
import congratsImageSrc from "../../asset/tutorials/flightTutorial/congrats.webp";
import { SystemObjectType } from "../saveFile/universeCoordinates";

export const FlightTutorial: Tutorial = {
    title: i18n.t("tutorials:flightTutorial:title"),
    coverImageSrc: welcomeImageSrc,
    description: i18n.t("tutorials:flightTutorial:description"),

    universeObjectId: {
        starSystem: {
            starSectorX: 0,
            starSectorY: 0,
            starSectorZ: 1,
            index: 1
        },
        objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
        index: 1
    },

    getContentPanelsHtml(): string[] {
        const welcomePanelHtml = `
        <div class="tutorialContent">
            <img src="${welcomeImageSrc}" alt="Welcome to Cosmos Journeyer">
            <p>${i18n.t("tutorials:flightTutorial:welcome")}</p>
            ${i18n.t("tutorials:common:navigationInfo", {
                nextKeys: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel).join(` ${i18n.t("common:or")} `),
                previousKeys: pressInteractionToStrings(TutorialControlsInputs.map.prevPanel).join(` ${i18n.t("common:or")} `),
                quitKeys: pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(` ${i18n.t("common:or")} `)
            })}
        </div>`;

        const rotationPanelHtml = `
        <div class="tutorialContent">
            <h2>${i18n.t("tutorials:flightTutorial:spaceShipRotationTitle")}</h2>
            <p>${i18n.t("tutorials:flightTutorial:spaceShipRotationText1")}</p>
            <img src="${rotationImageSrc}" alt="Spaceship Rotation">
            <p>${i18n.t("tutorials:flightTutorial:spaceShipRotationText2")}</p>
            <p>${i18n.t("tutorials:flightTutorial:spaceShipRotationText3")}</p>
        </div>`;

        const control = SpaceShipControlsInputs.map.throttle.bindings[0].control;
        if (!(control instanceof AxisComposite)) {
            throw new Error("Expected control to be an AxisComposite");
        }
        const throttleStrings = axisCompositeToString(control);

        const thrustPanelHtml = `
        <div class="tutorialContent">
            <h2>${i18n.t("tutorials:flightTutorial:spaceShipThrustTitle")}</h2>
            <p>${i18n.t("tutorials:flightTutorial:spaceShipThrustText1", {
                keyIncrease: throttleStrings[1][1],
                keyDecrease: throttleStrings[0][1],
                keyKill: pressInteractionToStrings(SpaceShipControlsInputs.map.throttleToZero).join(` ${i18n.t("common:or")} `)
            })}</p>
            <img src="${thrustImageSrc}" alt="Spaceship Thrust">
            <p>${i18n.t("tutorials:flightTutorial:spaceShipThrustText2")}</p>
            <p>${i18n.t("tutorials:flightTutorial:spaceShipThrustText3")}</p>
        </div>`;

        const warpPanelHtml = `
        <div class="tutorialContent">
            <h2>${i18n.t("tutorials:flightTutorial:spaceShipWarpDriveTitle")}</h2>
            <p>${i18n.t("tutorials:flightTutorial:spaceShipWarpDriveText1")}</p>
            <p>${i18n.t("tutorials:flightTutorial:spaceShipWarpDriveText2", { keyToggle: pressInteractionToStrings(SpaceShipControlsInputs.map.toggleWarpDrive).join(` ${i18n.t("common:or")} `) })}</p>
            <p>${i18n.t("tutorials:flightTutorial:spaceShipWarpDriveText3")}</p>
            <img src="${warpImageSrc}" alt="Warp Drive">
        </div>`;

        const congratsPanelHtml = `
        <div class="tutorialContent">
            <img src="${congratsImageSrc}" alt="Congratulations!">
            <p>${i18n.t("tutorials:flightTutorial:congratulationsText1")}</p>
            
            ${i18n.t("tutorials:common:tutorialEnding", {
                keyQuit: pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(` ${i18n.t("common:or")} `)
            })}
        </div>`;

        return [welcomePanelHtml, rotationPanelHtml, thrustPanelHtml, warpPanelHtml, congratsPanelHtml];
    }
};
