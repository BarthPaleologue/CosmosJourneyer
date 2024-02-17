//  This file is part of Cosmos Journeyer
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
import { parseSpeed } from "../utils/parseToStrings";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Matrix } from "@babylonjs/core/Maths/math";

export class HelmetOverlay {
    private parentNode: HTMLElement;
    private bodyNamePlate: HTMLElement;

    private targetHelper: HTMLElement;
    private targetDot: HTMLElement;
    private currentTarget: TransformNode | null = null;

    constructor() {
        if (document.querySelector("#helmetOverlay") === null) {
            document.body.insertAdjacentHTML("beforeend", overlayHTML);
        }
        this.parentNode = document.getElementById("helmetOverlay") as HTMLElement;
        this.bodyNamePlate = document.getElementById("bodyName") as HTMLElement;

        this.targetHelper = document.getElementById("targetHelper") as HTMLElement;
        this.targetDot = document.getElementById("targetDot") as HTMLElement;
    }

    public setVisibility(visible: boolean) {
        this.parentNode.style.visibility = visible ? "visible" : "hidden";
    }

    public isVisible(): boolean {
        return this.parentNode.style.visibility === "visible";
    }

    public setTarget(target: TransformNode | null) {
        if (target === null || this.currentTarget === target) {
            this.targetHelper.style.display = "none";
        } else {
            this.targetHelper.style.display = "block";
        }

        if(this.currentTarget === target) {
            this.currentTarget = null;
            return;
        }

        this.currentTarget = target;
    }

    public update(currentBody: OrbitalObject, currentControls: TransformNode) {
        this.bodyNamePlate.innerText = currentBody.name;

        if (this.currentTarget !== null) {
            const directionWorld = this.currentTarget.getAbsolutePosition().subtract(currentControls.getAbsolutePosition()).normalize();
            const directionLocal = Vector3.TransformNormal(directionWorld, Matrix.Invert(currentControls.getWorldMatrix()));

            // set class of targetDot based on sign of directionLocal.z
            this.targetDot.className = directionLocal.z > 0 ? "targetDot" : "targetDot behind";

            // set top and left of targetDot based on direction2D (use %)
            this.targetDot.style.top = `${50 - 50 * directionLocal.y}%`;
            this.targetDot.style.left = `${50 - 50 * directionLocal.x}%`;
        }
    }

    displaySpeed(shipInternalThrottle: number, shipTargetThrottle: number, speed: number) {
        const throttleString = `${(100 * shipInternalThrottle).toFixed(0)}% | ${(100 * shipTargetThrottle).toFixed(0)}%`;
        (document.querySelector("#speedometer") as HTMLElement).innerText = `${throttleString} | ${parseSpeed(speed)}`;
    }
}
