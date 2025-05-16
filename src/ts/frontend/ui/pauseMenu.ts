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

import { Observable } from "@babylonjs/core/Misc/observable";

import { ISoundPlayer, SoundType } from "@/frontend/audio/soundPlayer";

import { PanelType, SidePanels } from "./sidePanels";

export class PauseMenu {
    private readonly rootNode: HTMLElement;
    private readonly mask: HTMLElement;

    private readonly screenshotButton: HTMLElement;
    private readonly shareButton: HTMLElement;
    private readonly contributeButton: HTMLElement;
    private readonly tutorialsButton: HTMLElement;
    private readonly settingsButton: HTMLElement;
    private readonly loadButton: HTMLElement;
    private readonly saveButton: HTMLElement;
    private readonly resumeButton: HTMLElement;

    private readonly sidePanels: SidePanels;

    readonly onScreenshot = new Observable<void>();
    readonly onShare = new Observable<void>();
    readonly onSave = new Observable<void>();
    readonly onResume = new Observable<void>();

    constructor(sidePanels: SidePanels, soundPlayer: ISoundPlayer) {
        this.sidePanels = sidePanels;

        this.rootNode = document.getElementById("pauseMenu") as HTMLElement;
        this.mask = document.getElementById("pauseMask") as HTMLElement;

        this.screenshotButton = document.getElementById("screenshotButton") as HTMLElement;
        this.screenshotButton.addEventListener("click", () => this.onScreenshot.notifyObservers());

        this.shareButton = document.getElementById("shareButton") as HTMLElement;
        this.shareButton.addEventListener("click", () => this.onShare.notifyObservers());

        this.contributeButton = document.getElementById("pauseContributeButton") as HTMLElement;
        this.contributeButton.addEventListener("click", () => {
            soundPlayer.playNow(SoundType.CLICK);

            this.sidePanels.toggleActivePanel(PanelType.CONTRIBUTE);
        });

        this.tutorialsButton = document.getElementById("pauseTutorialsButton") as HTMLElement;
        this.tutorialsButton.addEventListener("click", () => {
            soundPlayer.playNow(SoundType.CLICK);

            this.sidePanels.toggleActivePanel(PanelType.TUTORIALS);
        });

        this.settingsButton = document.getElementById("pauseSettingsButton") as HTMLElement;
        this.settingsButton.addEventListener("click", () => {
            soundPlayer.playNow(SoundType.CLICK);

            this.sidePanels.toggleActivePanel(PanelType.SETTINGS);
        });

        this.loadButton = document.getElementById("loadButton") as HTMLElement;
        this.loadButton.addEventListener("click", () => {
            soundPlayer.playNow(SoundType.CLICK);

            this.sidePanels.toggleActivePanel(PanelType.LOAD_SAVE);
        });

        this.saveButton = document.getElementById("saveButton") as HTMLElement;
        this.saveButton.addEventListener("click", () => this.onSave.notifyObservers());

        this.resumeButton = document.getElementById("resumeButton") as HTMLElement;
        this.resumeButton.addEventListener("click", () => this.onResume.notifyObservers());

        document.querySelectorAll("#pauseMenu li").forEach((li) => {
            // play a sound when hovering over a button
            li.addEventListener("mouseenter", () => {
                soundPlayer.playNow(SoundType.HOVER);
            });

            // play a sound when clicking on a button
            li.addEventListener("click", () => {
                soundPlayer.playNow(SoundType.CLICK);
            });
        });

        this.setVisibility(false);
    }

    public setVisibility(visible: boolean) {
        this.rootNode.style.display = visible ? "grid" : "none";
        this.mask.style.display = visible ? "block" : "none";

        if (!visible) this.sidePanels.hideActivePanel();
    }

    public isVisible(): boolean {
        return this.rootNode.style.visibility !== "none";
    }
}
