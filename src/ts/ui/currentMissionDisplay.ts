import { Player } from "../player/player";
import { Mission } from "../missions/mission";

export class CurrentMissionDisplay {
    readonly rootNode: HTMLElement;

    private activeMissionIndex: number | null = null;

    private readonly defaultPanel: HTMLElement;

    private missionToPanel: Map<Mission, HTMLElement> = new Map();

    constructor(player: Player) {
        this.rootNode = document.createElement("div");
        this.rootNode.classList.add("currentMissionDisplay");

        this.defaultPanel = document.createElement("div");
        this.defaultPanel.classList.add("missionPanel");

        const defaultPanelH2 = document.createElement("h2");
        defaultPanelH2.innerText = "You don't have any active missions";
        this.defaultPanel.appendChild(defaultPanelH2);

        this.rootNode.appendChild(this.defaultPanel);
    }
}