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

import { parseSpeed } from "../utils/strings/parseToStrings";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Matrix } from "@babylonjs/core/Maths/math";
import { Player } from "../player/player";
import { CurrentMissionDisplay } from "./currentMissionDisplay";
import { MissionContext } from "../missions/missionContext";
import { smoothstep } from "../utils/math";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";

export class SpaceShipLayer {
    private readonly rootNode: HTMLElement;

    private readonly cursor: HTMLElement;

    private readonly targetHelper: HTMLElement;
    private readonly targetDot: HTMLElement;
    private currentTarget: TransformNode | null = null;

    private readonly fuelIndicator: HTMLElement;

    private readonly currentMissionDisplay: CurrentMissionDisplay;

    private readonly player: Player;

    constructor(player: Player, starSystemDatabase: StarSystemDatabase) {
        this.player = player;

        this.rootNode = document.getElementById("helmetOverlay") as HTMLElement;

        this.cursor = document.createElement("div");
        this.cursor.classList.add("cursor");
        this.rootNode.appendChild(this.cursor);

        this.targetHelper = document.getElementById("targetHelper") as HTMLElement;
        this.targetDot = document.getElementById("targetDot") as HTMLElement;

        this.fuelIndicator = document.getElementById("fuelIndicator") as HTMLElement;

        this.currentMissionDisplay = new CurrentMissionDisplay(player, starSystemDatabase);
        this.rootNode.appendChild(this.currentMissionDisplay.rootNode);

        document.addEventListener("mousemove", (event) => {
            this.cursor.style.left = `${event.clientX}px`;
            this.cursor.style.top = `${event.clientY}px`;

            const theta = Math.atan2(event.clientY - window.innerHeight / 2, event.clientX - window.innerWidth / 2);
            this.cursor.style.transform = `translate(-50%, -50%) rotate(${Math.PI / 2 + theta}rad)`;

            const distanceToCenter = Math.sqrt(
                (event.clientX - window.innerWidth / 2) ** 2 + (event.clientY - window.innerHeight / 2) ** 2
            );
            const normalizedDistance = Math.min(distanceToCenter / Math.min(window.innerWidth, window.innerHeight), 1);

            this.cursor.style.opacity = `${smoothstep(0.1, 0.2, normalizedDistance)}`;
        });
    }

    public setVisibility(visible: boolean) {
        this.rootNode.style.visibility = visible ? "visible" : "hidden";
    }

    public isVisible(): boolean {
        return this.rootNode.style.visibility === "visible";
    }

    public setTarget(target: TransformNode | null, forcedValue?: boolean) {
        let shouldHide = target === null || this.currentTarget === target;
        if (forcedValue !== undefined) shouldHide = !forcedValue;
        if (shouldHide) {
            this.targetHelper.style.display = "none";
            this.currentTarget = null;
            return;
        }

        this.targetHelper.style.display = "block";
        this.currentTarget = target;
    }

    public update(
        currentControls: TransformNode,
        missionContext: MissionContext,
        keyboardLayout: Map<string, string>,
        starSystemDatabase: StarSystemDatabase
    ) {
        if (this.currentTarget !== null) {
            const directionWorld = this.currentTarget
                .getAbsolutePosition()
                .subtract(currentControls.getAbsolutePosition())
                .normalize();
            const directionLocal = Vector3.TransformNormal(
                directionWorld,
                Matrix.Invert(currentControls.getWorldMatrix())
            );

            // set class of targetDot based on sign of directionLocal.z
            this.targetDot.className = directionLocal.z > 0 ? "targetDot" : "targetDot behind";

            // set top and left of targetDot based on direction2D (use %)
            this.targetDot.style.top = `${50 - 50 * directionLocal.y}%`;
            this.targetDot.style.left = `${50 - 50 * directionLocal.x}%`;
        }

        this.currentMissionDisplay.update(missionContext, keyboardLayout, starSystemDatabase);
    }

    displaySpeed(shipThrottle: number, speed: number) {
        const throttleContainer = document.getElementById("throttle");
        if (throttleContainer === null) throw new Error("Throttle container not found");
        throttleContainer.style.alignItems = shipThrottle < 0 ? "flex-start" : "flex-end";

        const throttleStripes = document.getElementById("throttleStripes");
        if (throttleStripes === null) throw new Error("Throttle bar not found");
        throttleStripes.style.height = `${(100 * Math.abs(shipThrottle)).toFixed(0)}%`;
        throttleStripes.classList.toggle("reversed", shipThrottle < 0);

        const speedIndicator = document.getElementById("speed");
        if (speedIndicator === null) throw new Error("Speed indicator not found");
        speedIndicator.innerText = parseSpeed(speed);
    }

    displayFuel(fuelRemainingFraction: number, nextJumpFuelFraction: number) {
        this.fuelIndicator.style.setProperty("--currentFuelLevel", `${(fuelRemainingFraction * 100).toFixed(0)}%`);
        this.fuelIndicator.style.setProperty(
            "--fuelLevelAfterJump",
            `${((fuelRemainingFraction - nextJumpFuelFraction) * 100).toFixed(0)}%`
        );
    }

    dispose() {
        this.rootNode.remove();
    }
}
