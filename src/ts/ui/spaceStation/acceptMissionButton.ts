import { Mission } from "../../missions/mission";
import { Player } from "../../player/player";
import { Sounds } from "../../assets/sounds";

export class AcceptMissionButton {
    readonly rootNode: HTMLElement;

    constructor(mission: Mission, player: Player) {
        this.rootNode = document.createElement("button");
        this.rootNode.className = "missionButton";
        this.rootNode.innerText = "Accept";

        if (player.currentMissions.find((m) => m.equals(mission))) {
            this.rootNode.classList.add("accepted");
            this.rootNode.innerText = "Accepted";
        }

        this.rootNode.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();
            if (player.currentMissions.find((m) => m.equals(mission))) {
                this.rootNode.classList.remove("accepted");
                this.rootNode.innerText = "Accept";
                player.currentMissions = player.currentMissions.filter((m) => !m.equals(mission));
                return;
            }

            this.rootNode.classList.add("accepted");
            this.rootNode.innerText = "Accepted";
            player.currentMissions.push(mission);
        });
    }
}
