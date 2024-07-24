export function getDivs() {
    const firstPanel = document.createElement("div");
    firstPanel.classList.add("tutorialContent");

    const text = document.createElement("p");
    text.innerText = "Welcome to Cosmos Journeyer! This tutorial will guide you through the basics of piloting your ship. Click 'Next' to continue.";

    firstPanel.appendChild(text);

    return [firstPanel];
}