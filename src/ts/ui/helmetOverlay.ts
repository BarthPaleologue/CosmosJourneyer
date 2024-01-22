//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import overlayHTML from "../../html/helmetOverlay.html";
import { OrbitalObject } from "../architecture/orbitalObject";

export class HelmetOverlay {
    private parentNode: HTMLElement;
    private bodyNamePlate: HTMLElement;

    constructor() {
        if (document.querySelector("#helmetOverlay") === null) {
            document.body.insertAdjacentHTML("beforeend", overlayHTML);
        }
        this.parentNode = document.getElementById("helmetOverlay") as HTMLElement;
        this.bodyNamePlate = document.getElementById("bodyName") as HTMLElement;
    }

    public setVisibility(visible: boolean) {
        this.parentNode.style.visibility = visible ? "visible" : "hidden";
    }

    public isVisible(): boolean {
        return this.parentNode.style.visibility === "visible";
    }

    public update(currentBody: OrbitalObject) {
        this.bodyNamePlate.innerText = currentBody.name;
    }
}
