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

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { type Mission } from "@/frontend/missions/mission";
import { type Player } from "@/frontend/player/player";

import i18n from "@/i18n";

export class AcceptMissionButton {
    readonly rootNode: HTMLElement;

    constructor(mission: Mission, player: Player, soundPlayer: ISoundPlayer) {
        this.rootNode = document.createElement("button");
        this.rootNode.className = "missionButton";
        this.rootNode.innerText = i18n.t("missions:common:accept");

        if (player.currentMissions.find((m) => m.equals(mission))) {
            this.rootNode.classList.add("accepted");
            this.rootNode.innerText = i18n.t("missions:common:accepted");
        }

        this.rootNode.addEventListener("click", () => {
            soundPlayer.playNow(SoundType.CLICK);
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
