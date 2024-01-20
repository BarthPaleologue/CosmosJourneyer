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

import { Observable } from "@babylonjs/core/Misc/observable";

import { Input, InputType } from "./input";
import { clamp } from "terrain-generation";

export class Mouse implements Input {
    readonly type = InputType.MOUSE;

    private x = 0;
    private y = 0;

    private dx = 0;
    private dy = 0;

    private dxToCenter = 0;
    private dyToCenter = 0;

    deadAreaRadius = 100;
    private canvas: HTMLCanvasElement;

    private isLeftButtonDown = false;

    readonly onMouseEnterObservable: Observable<void> = new Observable();
    readonly onMouseLeaveObservable: Observable<void> = new Observable();

    constructor(canvas: HTMLCanvasElement, deadAreaRadius = 50) {
        this.deadAreaRadius = deadAreaRadius;
        this.canvas = canvas;

        window.addEventListener("pointermove", (e) => {
            const canvasRect = this.canvas.getBoundingClientRect();
            if (e.x < canvasRect.x || e.y < canvasRect.y || e.x > canvasRect.x + canvasRect.width || e.y > canvasRect.y + canvasRect.height) return;

            this.dx = e.x - this.x;
            this.dy = e.y - this.y;

            this.dxToCenter = e.x - this.canvas.width / 2;
            this.dyToCenter = e.y - this.canvas.height / 2;
        });

        window.addEventListener("mouseenter", () => {
            this.onMouseEnterObservable.notifyObservers();
        });
        window.addEventListener("mouseleave", () => {
            this.onMouseLeaveObservable.notifyObservers();
        });

        window.addEventListener("pointerdown", (e) => {
            if (e.button === 0) this.isLeftButtonDown = true;
        });

        window.addEventListener("pointerup", (e) => {
            if (e.button === 0) this.isLeftButtonDown = false;
        });
    }

    public isLeftButtonPressed(): boolean {
        return this.isLeftButtonDown;
    }

    public reset() {
        this.x += this.dx;
        this.y += this.dy;

        this.dx = 0;
        this.dy = 0;
    }

    getRoll() {
        const d2 = this.dxToCenter ** 2 + this.dyToCenter ** 2;
        const adaptedLength = Math.max(Math.log(d2 / this.deadAreaRadius ** 2), 0) / 3;
        const greaterLength = Math.max(this.canvas.width, this.canvas.height);
        return clamp((this.dxToCenter * adaptedLength) / (greaterLength / 2), -1, 1);
    }

    getPitch() {
        const d2 = this.dxToCenter ** 2 + this.dyToCenter ** 2;
        const adaptedLength = Math.max(Math.log(d2 / this.deadAreaRadius ** 2), 0) / 3;
        const greaterLength = Math.max(this.canvas.width, this.canvas.height);
        return clamp((this.dyToCenter * adaptedLength) / (greaterLength / 2), -1, 1);
    }

    getYaw() {
        return 0;
    }

    getZAxis() {
        return 0;
    }

    getXAxis() {
        return 0;
    }

    getYAxis() {
        return 0;
    }

    getAcceleration(): number {
        return 0;
    }

    getDx(): number {
        return this.dx;
    }

    getDxNormalized(): number {
        return this.dx / Math.max(this.canvas.width, this.canvas.height);
    }

    getDy(): number {
        return this.dy;
    }

    getDyNormalized(): number {
        return this.dy / Math.max(this.canvas.height, this.canvas.width);
    }
}
