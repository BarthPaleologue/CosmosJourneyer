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

import type { TFunction } from "i18next";

import type { Mission } from "@/frontend/gameplay/missions/mission";
import type { Player } from "@/frontend/gameplay/player/player";
import type { ISoundPlayer } from "@/frontend/presentation/audio/soundPlayer";

export class AcceptMissionButton {
    readonly rootNode: HTMLElement;

    constructor(mission: Mission, player: Player, soundPlayer: ISoundPlayer, t: TFunction) {
        this.rootNode = document.createElement("button");
        this.rootNode.className = "missionButton";
        this.rootNode.innerText = t("missions:common:accept");

        if (player.currentMissions.find((m) => m.equals(mission))) {
            this.rootNode.classList.add("accepted");
            this.rootNode.innerText = t("missions:common:accepted");
        }

        this.rootNode.addEventListener("click", () => {
            soundPlayer.playNow("click");
            if (player.currentMissions.find((m) => m.equals(mission))) {
                this.rootNode.classList.remove("accepted");
                this.rootNode.innerText = t("missions:common:accept");
                player.currentMissions = player.currentMissions.filter((m) => !m.equals(mission));
                return;
            }

            this.rootNode.classList.add("accepted");
            this.rootNode.innerText = t("missions:common:accepted");
            player.currentMissions.push(mission);
        });
    }
}
