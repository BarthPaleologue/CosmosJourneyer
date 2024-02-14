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

import { Observable } from "@babylonjs/core/Misc/observable";
import pauseMenuHTML from "../../html/pauseMenu.html";

export class PauseMenu {
    private readonly rootNode: HTMLElement;
    private readonly mask: HTMLElement;

    private readonly screenshotButton: HTMLElement;
    private readonly shareButton: HTMLElement;
    private readonly saveButton: HTMLElement;
    private readonly resumeButton: HTMLElement;

    readonly onScreenshot = new Observable<void>();
    readonly onShare = new Observable<void>();
    readonly onSave = new Observable<void>();
    readonly onResume = new Observable<void>();

    constructor() {
        document.body.insertAdjacentHTML("beforeend", pauseMenuHTML);
        this.rootNode = document.getElementById("pauseMenu") as HTMLElement;
        this.mask = document.getElementById("pauseMask") as HTMLElement;

        this.screenshotButton = document.getElementById("screenshotButton") as HTMLElement;
        this.screenshotButton.addEventListener("click", () => this.onScreenshot.notifyObservers());

        this.shareButton = document.getElementById("shareButton") as HTMLElement;
        this.shareButton.addEventListener("click", () => this.onShare.notifyObservers());

        this.saveButton = document.getElementById("saveButton") as HTMLElement;
        this.saveButton.addEventListener("click", () => this.onSave.notifyObservers());

        this.resumeButton = document.getElementById("resumeButton") as HTMLElement;
        this.resumeButton.addEventListener("click", () => this.onResume.notifyObservers());

        this.setVisibility(false);
    }

    public setVisibility(visible: boolean) {
        this.rootNode.style.display = visible ? "grid" : "none";
        this.mask.style.display = visible ? "block" : "none";
    }

    public isVisible(): boolean {
        return this.rootNode.style.visibility !== "none";
    }
}
