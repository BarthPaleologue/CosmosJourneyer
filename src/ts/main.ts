import bodyEditor from "./bodyEditor.html?raw";
import spaceStationUI from "./spaceStationUI.html?raw";
import helmetOverlay from "./helmetOverlay.html?raw";
import mainMenu from "./mainMenu.html?raw";
import pauseMenu from "./pauseMenu.html?raw";
import sidePanels from "./sidePanels.html?raw";

document.body.insertAdjacentHTML("beforeend", bodyEditor);
document.body.insertAdjacentHTML("beforeend", spaceStationUI);
document.body.insertAdjacentHTML("beforeend", helmetOverlay);
document.body.insertAdjacentHTML("beforeend", mainMenu);
document.body.insertAdjacentHTML("beforeend", pauseMenu);
document.body.insertAdjacentHTML("beforeend", sidePanels);
