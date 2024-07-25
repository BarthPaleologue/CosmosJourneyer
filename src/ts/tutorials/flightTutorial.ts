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

import welcomeImageSrc from "../../asset/tutorials/flightTutorial/welcome.webp";
import rotationImageSrc from "../../asset/tutorials/flightTutorial/rotation.webp";
import thrustImageSrc from "../../asset/tutorials/flightTutorial/thrust.webp";
import warpImageSrc from "../../asset/tutorials/flightTutorial/warp.webp";
import congratsImageSrc from "../../asset/tutorials/flightTutorial/congrats.webp";
import { EmptyObject } from "../utils/emptyObjects";

export const FlightTutorial: Tutorial<EmptyObject> = {
    title: "Flight Tutorial",
    coverImageSrc: welcomeImageSrc,
    description: "Learn the basics of space flight in less than 5 minutes.",
    getContentPanelsHtml(): string[] {
        const welcomePanelHtml = `
        <div class="tutorialContent">
            <img src="${welcomeImageSrc}" alt="Welcome to Cosmos Journeyer">
            <p>Welcome to Cosmos Journeyer, Commander! If this is your first time, this tutorial will cover the basics of space flight.</p>
            <p>To move forward in the tutorial, simply press ${pressInteractionToStrings(TutorialControlsInputs.map.nextPanel).join(" or ")}. You can go back to the previous panel by pressing ${pressInteractionToStrings(TutorialControlsInputs.map.prevPanel).join(" or ")}.</p> 
            <p>You can leave the tutorial at any time by pressing ${pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(" or ")}.</p>
        </div>`;

        const rotationPanelHtml = `
        <div class="tutorialContent">
            <h2>Spaceship Rotation</h2>
            <p>The spaceship rotation is controlled by the mouse. Moving the mouse left or right will make the spaceship roll. Moving the mouse up or down will make the spaceship pitch.</p>
            <img src="${rotationImageSrc}" alt="Spaceship Rotation">
            <p>The yellow arrow on the screen is there to help you understand the orientation of the spaceship. Its opacity also indicates the rate of rotation.</p>
            <p>Try to get a feel for the controls by rotating the spaceship. You will get better at it with practice.</p>
        </div>`;

        const control = SpaceShipControlsInputs.map.throttle.bindings[0].control;
        if (!(control instanceof AxisComposite)) {
            throw new Error("Expected control to be an AxisComposite");
        }
        const throttleStrings = axisCompositeToString(control);

        const thrustPanelHtml = `
        <div class="tutorialContent">
            <h2>Spaceship Thrust</h2>
            <p>Assuming a QWERTY layout, you can throttle the main engines with ${throttleStrings[1][1]} and ${throttleStrings[0][1]}. Pressing ${pressInteractionToStrings(SpaceShipControlsInputs.map.throttleToZero).join(" or ")} will set the throttle to zero.</p>
            <img src="${thrustImageSrc}" alt="Spaceship Thrust">
            <p>Your throttle is displayed as a vertical progress bar on the bottom right of the screen alongside your speed.</p>
            <p>Try flying around the asteroid field to get familiar with the controls.</p>
        </div>`;

        const warpPanelHtml = `
        <div class="tutorialContent">
            <h2>Warp Drive</h2>
            <p>Moving between planets and stars will often require faster than light (FTL) travel in order to reach your destination before the heat death of the universe.</p>
            <p>Your spaceship comes equipped with a warp drive to do just that. Pressing F will toggle the warp drive on and off. The warp throttle can be adjusted like for the main engines.</p>
            <p>Fly up or down to leave the asteroid field and then engage your warp drive to fly away to the stars!</p>
            <img src="${warpImageSrc}" alt="Warp Drive">
        </div>`;

        const congratsPanelHtml = `
        <div class="tutorialContent">
            <img src="${congratsImageSrc}" alt="Congratulations!">
            <p>Congratulations, Commander! You have completed the flight tutorial. You are now ready to explore the cosmos. Good luck, and have fun!</p>
            <p>This tutorial and others are available at any time from the main menu and the pause menu.</p>
            <p>Press ${pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(" or ")} to leave the tutorial.</p>
        </div>`;

        return [welcomePanelHtml, rotationPanelHtml, thrustPanelHtml, warpPanelHtml, congratsPanelHtml];
    }
};
