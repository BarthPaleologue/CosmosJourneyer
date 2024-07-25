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
import pauseMenuHTML from "../../html/pauseMenu.html";
import i18n from "../i18n";
import { Sounds } from "../assets/sounds";

export class PauseMenu {
    private readonly rootNode: HTMLElement;
    private readonly mask: HTMLElement;

    private readonly screenshotButton: HTMLElement;
    private readonly shareButton: HTMLElement;
    private readonly contributeButton: HTMLElement;
    private readonly tutorialsButton: HTMLElement;
    private readonly settingsButton: HTMLElement;
    private readonly saveButton: HTMLElement;
    private readonly resumeButton: HTMLElement;

    private readonly tutorialsPanel: HTMLElement;
    private readonly settingsPanel: HTMLElement;
    private readonly contibutePanel: HTMLElement;
    private activePanel: HTMLElement | null = null;

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
        this.screenshotButton.innerText = i18n.t("pauseMenu:screenshot");

        this.shareButton = document.getElementById("shareButton") as HTMLElement;
        this.shareButton.addEventListener("click", () => this.onShare.notifyObservers());
        this.shareButton.innerText = i18n.t("pauseMenu:share");

        this.contributeButton = document.getElementById("pauseContributeButton") as HTMLElement;
        this.contributeButton.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();

            this.setActivePanel(this.activePanel === this.contibutePanel ? null : this.contibutePanel);
        });
        this.contributeButton.innerText = i18n.t("pauseMenu:contribute");

        this.tutorialsButton = document.getElementById("pauseTutorialsButton") as HTMLElement;
        this.tutorialsButton.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();

            this.setActivePanel(this.activePanel === this.tutorialsPanel ? null : this.tutorialsPanel);
        });
        this.tutorialsButton.innerText = i18n.t("pauseMenu:tutorials");

        this.settingsButton = document.getElementById("pauseSettingsButton") as HTMLElement;
        this.settingsButton.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();

            this.setActivePanel(this.activePanel === this.settingsPanel ? null : this.settingsPanel);
        });
        this.settingsButton.innerText = i18n.t("pauseMenu:settings");

        this.saveButton = document.getElementById("saveButton") as HTMLElement;
        this.saveButton.addEventListener("click", () => this.onSave.notifyObservers());
        this.saveButton.innerText = i18n.t("pauseMenu:save");

        this.resumeButton = document.getElementById("resumeButton") as HTMLElement;
        this.resumeButton.addEventListener("click", () => this.onResume.notifyObservers());
        this.resumeButton.innerText = i18n.t("pauseMenu:resume");

        document.querySelectorAll("#pauseMenu li").forEach((li) => {
            // play a sound when hovering over a button
            li.addEventListener("mouseenter", () => {
                Sounds.MENU_HOVER_SOUND.play();
            });

            // play a sound when clicking on a button
            li.addEventListener("click", () => {
                Sounds.MENU_SELECT_SOUND.play();
            });
        });

        const tutorialsPanel = document.getElementById("tutorials");
        if (tutorialsPanel === null) throw new Error("#tutorials not found");
        this.tutorialsPanel = tutorialsPanel;

        const settingsPanel = document.getElementById("settingsPanel");
        if (settingsPanel === null) throw new Error("#settingsPanel not found");
        this.settingsPanel = settingsPanel;

        const contributePanel = document.getElementById("contribute");
        if (contributePanel === null) throw new Error("#contribute not found");
        this.contibutePanel = contributePanel;

        this.setVisibility(false);
    }

    private setActivePanel(panel: HTMLElement | null) {
        if (this.activePanel !== null) {
            this.activePanel.classList.remove("visible");
        }

        this.activePanel = panel;

        if (this.activePanel !== null) {
            this.activePanel.classList.add("visible");
        }
    }

    public setVisibility(visible: boolean) {
        this.rootNode.style.display = visible ? "grid" : "none";
        this.mask.style.display = visible ? "block" : "none";

        this.activePanel?.classList.remove("visible");
    }

    public isVisible(): boolean {
        return this.rootNode.style.visibility !== "none";
    }
}
