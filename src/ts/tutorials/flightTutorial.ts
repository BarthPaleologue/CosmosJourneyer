import { SpaceShipControlsInputs } from "../spaceship/spaceShipControlsInputs";
import { TutorialControlsInputs } from "../ui/tutorial/tutorialLayerInputs";
import { axisCompositeToString, pressInteractionToStrings } from "../utils/inputControlsString";
import { AxisComposite } from "@brianchirls/game-input/browser";

import welcomeImageSrc from "../../asset/tutorials/flightTutorial/welcome.webp";
import rotationImageSrc from "../../asset/tutorials/flightTutorial/rotation.webp";
import thrustImageSrc from "../../asset/tutorials/flightTutorial/thrust.webp";
import warpImageSrc from "../../asset/tutorials/flightTutorial/warp.webp";
import congratsImageSrc from "../../asset/tutorials/flightTutorial/congrats.webp";

export function getDivs() {
    const welcomePanel = document.createElement("div");
    welcomePanel.classList.add("tutorialContent");

    const welcomeImage = document.createElement("img");
    welcomeImage.src = welcomeImageSrc;
    welcomeImage.alt = "Welcome to Cosmos Journeyer";
    welcomePanel.appendChild(welcomeImage);

    const welcomePanelText = document.createElement("p");
    welcomePanelText.innerText = `Welcome to Cosmos Journeyer, Commander! If this is your first time, this tutorial will cover the basics of space flight.
    
    To move forward in the tutorial, simply press ${pressInteractionToStrings(TutorialControlsInputs.map.nextPanel).join(" or ")}. You can go back to the previous panel by pressing ${pressInteractionToStrings(TutorialControlsInputs.map.prevPanel).join(" or ")}. 
    
    You can leave the tutorial at any time by pressing ${pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(" or ")}.`;

    welcomePanel.appendChild(welcomePanelText);

    const rotationPanel = document.createElement("div");
    rotationPanel.classList.add("tutorialContent");

    const rotationPanelTitle = document.createElement("h2");
    rotationPanelTitle.innerText = `Spaceship Rotation`;
    rotationPanel.appendChild(rotationPanelTitle);

    const rotationPanelText = document.createElement("p");
    rotationPanelText.innerText = `The spaceship rotation is controlled by the mouse. Moving the mouse left or right will make the spaceship roll. Moving the mouse up or down will make the spaceship pitch.`
    rotationPanel.appendChild(rotationPanelText);

    const rotationImage = document.createElement("img");
    rotationImage.src = rotationImageSrc;
    rotationImage.alt = "Spaceship Rotation";
    rotationPanel.appendChild(rotationImage);

    const rotationPanelText2 = document.createElement("p");
    rotationPanelText2.innerText = `The yellow arrow on the screen is there to help you understand the orientation of the spaceship. Its opacity also indicates the rate of rotation.
    
    Try to get a feel for the controls by rotating the spaceship. You will get better at it with practice.`;
    rotationPanel.appendChild(rotationPanelText2);

    const thrustPanel = document.createElement("div");
    thrustPanel.classList.add("tutorialContent");

    const thrustPanelTitle = document.createElement("h2");
    thrustPanelTitle.innerText = `Spaceship Thrust`;
    thrustPanel.appendChild(thrustPanelTitle);

    const thrustPanelText = document.createElement("p");

    const control = SpaceShipControlsInputs.map.throttle.bindings[0].control;
    if(!(control instanceof AxisComposite)) {
        throw new Error("Expected control to be an AxisComposite");
    }
    const throttleStrings = axisCompositeToString(control);
    console.log(axisCompositeToString(control));
    thrustPanelText.innerText = `You can throttle the main engines with ${throttleStrings[1][1]} and ${throttleStrings[0][1]}. 
    Pressing ${pressInteractionToStrings(SpaceShipControlsInputs.map.throttleToZero).join(" or ")} will set the throttle to zero.
    Please note that these bindings assume a QWERTY layout.`;
    thrustPanel.appendChild(thrustPanelText);

    const thrustImage = document.createElement("img");
    thrustImage.src = thrustImageSrc;
    thrustImage.alt = "Spaceship Thrust";
    thrustPanel.appendChild(thrustImage);


    const thrustPanelText2 = document.createElement("p");
    thrustPanelText2.innerText = `Your throttle is displayed as a vertical progress bar on the bottom right of the screen alongside your speed. 
    Try flying around the asteroid field to get familiar with the controls.`;
    thrustPanel.appendChild(thrustPanelText2);

    const warpPanel = document.createElement("div");
    warpPanel.classList.add("tutorialContent");

    const warpPanelTitle = document.createElement("h2");
    warpPanelTitle.innerText = `Warp Drive`;
    warpPanel.appendChild(warpPanelTitle);

    const warpPanelText = document.createElement("p");
    warpPanelText.innerText = `Moving between planets and stars will often require faster than light (FTL) travel in order to reach your destination before the heat death of the universe. 
    
    Your spaceship comes equipped with a warp drive to do just that. Pressing ${pressInteractionToStrings(SpaceShipControlsInputs.map.toggleWarpDrive).join(" or ")} will toggle the warp drive on and off. The warp throttle can be adjusted like for the main engines.
    
    Fly up or down to leave the asteroid field and then engage your warp drive to fly away to the stars!`;
    warpPanel.appendChild(warpPanelText);

    const warpImage = document.createElement("img");
    warpImage.src = warpImageSrc;
    warpImage.alt = "Warp Drive";
    warpPanel.appendChild(warpImage);


    const congratsPanel = document.createElement("div");
    congratsPanel.classList.add("tutorialContent");

    const congratsImage = document.createElement("img");
    congratsImage.src = congratsImageSrc;
    congratsImage.alt = "Congratulations!";
    congratsPanel.appendChild(congratsImage);

    const congratsPanelText = document.createElement("p");
    congratsPanelText.innerText = `Congratulations, Commander! You have completed the flight tutorial. You are now ready to explore the cosmos. Good luck, and have fun!
    
    This tutorial and others are available at any time from the main menu and the pause menu.
    
    Press ${pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(" or ")} to leave the tutorial.`;
    congratsPanel.appendChild(congratsPanelText);

    return [welcomePanel, rotationPanel, thrustPanel, warpPanel, congratsPanel];
}