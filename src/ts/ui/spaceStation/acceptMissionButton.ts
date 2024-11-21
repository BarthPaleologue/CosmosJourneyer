import { Mission } from "../../missions/mission";
import { Player } from "../../player/player";
import { Sounds } from "../../assets/sounds";
import i18n from "../../i18n";

export class AcceptMissionButton {
    readonly rootNode: HTMLElement;

    constructor(mission: Mission, player: Player) {
        this.rootNode = document.createElement("button");
        this.rootNode.className = "missionButton";
        this.rootNode.innerText = i18n.t("missions:common:accept");

        if (player.currentMissions.find((m) => m.equals(mission))) {
            this.rootNode.classList.add("accepted");
            this.rootNode.innerText = i18n.t("missions:common:accepted");
        }

        this.rootNode.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();
            if (player.currentMissions.find((m) => m.equals(mission))) {
                this.rootNode.classList.remove("accepted");
                this.rootNode.innerText = i18n.t("missions:common:accept");
                player.currentMissions = player.currentMissions.filter((m) => !m.equals(mission));
                return;
            }

            this.rootNode.classList.add("accepted");
            this.rootNode.innerText = i18n.t("missions:common:accepted");
            player.currentMissions.push(mission);
        });
    }
}
