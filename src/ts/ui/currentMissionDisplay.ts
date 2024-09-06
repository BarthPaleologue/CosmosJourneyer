import { Player } from "../player/player";
import { Mission } from "../missions/mission";

export class CurrentMissionDisplay {
    readonly rootNode: HTMLElement;

    private activeMissionIndex: number | null = null;

    constructor(player: Player) {
        this.rootNode = document.createElement("div");
        this.rootNode.classList.add("currentMissionDisplay");

        this.setNoMissionActive();
    }

    private setMissionActive(mission: Mission) {
        const panelRoot = document.createElement("div");

        this.rootNode.innerHTML = "";
        this.rootNode.appendChild(panelRoot);
    }

    private setNoMissionActive() {
        const defaultPanel = document.createElement("div");
        defaultPanel.classList.add("missionPanel");

        const defaultPanelH2 = document.createElement("h2");
        defaultPanelH2.innerText = "You don't have any active missions";
        defaultPanel.appendChild(defaultPanelH2);

        this.rootNode.innerHTML = "";
        this.rootNode.appendChild(defaultPanel);
    }
}