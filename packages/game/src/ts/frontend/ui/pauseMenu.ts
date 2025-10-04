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

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";

import i18n from "@/i18n";

import { PanelType, type SidePanels } from "./sidePanels";

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

        this.mask = document.createElement("div");
        this.mask.id = "pauseMask";

        this.rootNode = document.createElement("ul");
        this.rootNode.id = "pauseMenu";
        this.rootNode.classList.add("leftSideMenu");

        const createButton = (id: string, i18nKey: string): HTMLElement => {
            const button = document.createElement("li");
            button.id = id;
            button.classList.add("button");
            button.innerText = i18n.t(i18nKey);
            this.rootNode.appendChild(button);
            return button;
        };

        this.resumeButton = createButton("resumeButton", "pauseMenu:resume");
        this.saveButton = createButton("saveButton", "pauseMenu:save");
        this.loadButton = createButton("loadButton", "pauseMenu:load");
        this.tutorialsButton = createButton("pauseTutorialsButton", "pauseMenu:tutorials");
        this.settingsButton = createButton("pauseSettingsButton", "pauseMenu:settings");
        this.contributeButton = createButton("pauseContributeButton", "pauseMenu:contribute");
        this.screenshotButton = createButton("screenshotButton", "pauseMenu:screenshot");
        this.shareButton = createButton("shareButton", "pauseMenu:share");

        this.mask.appendChild(this.rootNode);
        document.body.appendChild(this.mask);

        this.screenshotButton.addEventListener("click", () => this.onScreenshot.notifyObservers());
        this.shareButton.addEventListener("click", () => this.onShare.notifyObservers());
        this.contributeButton.addEventListener("click", async () => {
            soundPlayer.playNow(SoundType.CLICK);
            await this.sidePanels.toggleActivePanel(PanelType.CONTRIBUTE);
        });
        this.tutorialsButton.addEventListener("click", async () => {
            soundPlayer.playNow(SoundType.CLICK);
            await this.sidePanels.toggleActivePanel(PanelType.TUTORIALS);
        });
        this.settingsButton.addEventListener("click", async () => {
            soundPlayer.playNow(SoundType.CLICK);
            await this.sidePanels.toggleActivePanel(PanelType.SETTINGS);
        });
        this.loadButton.addEventListener("click", async () => {
            soundPlayer.playNow(SoundType.CLICK);
            await this.sidePanels.toggleActivePanel(PanelType.LOAD_SAVE);
        });
        this.saveButton.addEventListener("click", () => this.onSave.notifyObservers());
        this.resumeButton.addEventListener("click", () => this.onResume.notifyObservers());

        const listItems: NodeListOf<HTMLElement> = this.rootNode.querySelectorAll("li");

        listItems.forEach((li) => {
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
        return this.rootNode.style.display !== "none";
    }
}
