import { Mission } from "../../missions/mission";
import { Player } from "../../player/player";
import { Settings } from "../../settings";
import { AcceptMissionButton } from "./acceptMissionButton";

export class MissionContainer {
    readonly rootNode: HTMLElement;

    constructor(mission: Mission, player: Player) {
        this.rootNode = document.createElement("div");
        this.rootNode.className = "missionItem";

        const descriptionContainer = document.createElement("div");
        descriptionContainer.className = "missionDescription";
        this.rootNode.appendChild(descriptionContainer);

        const missionH4 = document.createElement("h4");
        missionH4.innerText = mission.getTypeString();
        descriptionContainer.appendChild(missionH4);

        const missionP = document.createElement("p");
        missionP.innerText = mission.describe();
        descriptionContainer.appendChild(missionP);

        const rewardP = document.createElement("p");
        rewardP.innerText = `Reward: ${Settings.CREDIT_SYMBOL}${mission.getReward().toLocaleString()}`;
        descriptionContainer.appendChild(rewardP);

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "missionButtonContainer";
        this.rootNode.appendChild(buttonContainer);

        const acceptButton = new AcceptMissionButton(mission, player);
        buttonContainer.appendChild(acceptButton.rootNode);
    }
}
