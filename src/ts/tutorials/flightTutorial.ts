import { SpaceShipControlsInputs } from "../spaceship/spaceShipControlsInputs";
import { TutorialControlsInputs } from "../ui/tutorial/tutorialLayerInputs";
import { pressInteractionToStrings } from "../utils/inputControlsString";

export function getDivs() {
    const welcomePanel = document.createElement("div");
    welcomePanel.classList.add("tutorialContent");

    const welcomePanelText = document.createElement("p");
    welcomePanelText.innerText = `Welcome to Cosmos Journeyer, Commander! If this is your first flight, this tutorial will cover the basics of space flight.
    
    To start the tutorial, simply press ${pressInteractionToStrings(TutorialControlsInputs.map.nextPanel).join(" or ")}. You can go back to the previous panel by pressing ${pressInteractionToStrings(TutorialControlsInputs.map.prevPanel).join(" or ")}. 
    
    You can leave the tutorial at any time by pressing ${pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(" or ")}.`;

    welcomePanel.appendChild(welcomePanelText);

    const rotationPanel = document.createElement("div");
    rotationPanel.classList.add("tutorialContent");

    const rotationPanelTitle = document.createElement("h2");
    rotationPanelTitle.innerText = `Spaceship Rotation`;

    const rotationPanelText = document.createElement("p");
    rotationPanelText.innerText = `The spaceship rotation is controlled by the mouse. Moving the mouse left or right will make the spaceship roll. Moving the mouse up or down will make the spaceship pitch. 
    
    The yellow arrow on the screen is there to help you understand the orientation of the spaceship. Its opacity also indicates the rate of rotation.
    
    Try to get a feel for the controls by rotating the spaceship. You will get better at it with practice.
    
    Once you feel comfortable enough, press ${pressInteractionToStrings(TutorialControlsInputs.map.nextPanel).join(" or ")} to continue.`;

    rotationPanel.appendChild(rotationPanelTitle);
    rotationPanel.appendChild(rotationPanelText);

    const thrustPanel = document.createElement("div");
    thrustPanel.classList.add("tutorialContent");

    const thrustPanelTitle = document.createElement("h2");
    thrustPanelTitle.innerText = `Spaceship Thrust`;

    const thrustPanelText = document.createElement("p");
    thrustPanelText.innerText = `Rotating is well and good, but we won't get far without using our main engines. You can throttle the main engines with the W and S keys: W to increase thrust and S to decrease it. Pressing ${pressInteractionToStrings(SpaceShipControlsInputs.map.throttleToZero).join(" or ")} will set the throttle to zero.

    Your current throttle is displayed as a vertical progress bar on the bottom right of the screen alongside your current speed.

    You can fly around the asteroid field to get familiar with the controls. Be careful with the asteroids!
    
    When you are ready, press ${pressInteractionToStrings(TutorialControlsInputs.map.nextPanel).join(" or ")} to continue.`;

    thrustPanel.appendChild(thrustPanelTitle);
    thrustPanel.appendChild(thrustPanelText);

    const warpPanel = document.createElement("div");
    warpPanel.classList.add("tutorialContent");

    const warpPanelTitle = document.createElement("h2");
    warpPanelTitle.innerText = `Warp Drive`;

    const warpPanelText = document.createElement("p");
    warpPanelText.innerText = `Space is absurdly big as you will soon experience. Moving between planets and stars will often require faster than light (FTL) travel in order to reach your destination before the heat death of the universe. 
    
    Thankfully your spaceship comes equipped with a warp drive to do just that. Pressing the ${pressInteractionToStrings(SpaceShipControlsInputs.map.toggleWarpDrive).join(" or ")} key will toggle the warp drive on and off. Its throttle can be adjusted just like the main engines with the W and S keys.
    
    Fly up or down to leave the asteroid field and then engage your warp drive to fly away to the stars!
    
    You are now ready to explore the cosmos. Good luck, and have fun!

    This tutorial and others are available at any time from the main menu.
    
    Press ${pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(" or ")} to leave the tutorial.`;

    warpPanel.appendChild(warpPanelTitle);
    warpPanel.appendChild(warpPanelText);

    return [welcomePanel, rotationPanel, thrustPanel, warpPanel];
}