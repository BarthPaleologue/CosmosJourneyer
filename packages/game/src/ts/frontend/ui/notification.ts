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

import informationIcon from "@assets/icons/information.webp";
import explorationIcon from "@assets/icons/space-exploration.webp";
import spaceStationIcon from "@assets/icons/space-station.webp";
import spaceshipIcon from "@assets/icons/spaceship_gear.webp";

export const enum NotificationOrigin {
    GENERAL = "info",
    SPACESHIP = "spaceship",
    EXPLORATION = "exploration",
    SPACE_STATION = "space-station",
}

export const enum NotificationIntent {
    INFO = "info",
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error",
}

export class Notification {
    private progressSeconds = 0;
    private readonly progressDurationSeconds;
    private removalProgressSeconds = 0;
    private readonly removalDurationSeconds = 0.5;

    readonly htmlRoot: HTMLDivElement;

    private isBeingRemoved = false;

    constructor(
        origin: NotificationOrigin,
        intent: NotificationIntent,
        text: string,
        durationSeconds: number,
        soundPlayer: ISoundPlayer,
        container: HTMLDivElement,
        documentRef: Document,
    ) {
        const doc = documentRef;

        this.htmlRoot = doc.createElement("div");
        this.htmlRoot.classList.add("notification", origin);

        const contentContainer = doc.createElement("div");
        contentContainer.classList.add("notification-content");
        this.htmlRoot.appendChild(contentContainer);

        const iconNode = doc.createElement("img");
        switch (origin) {
            case NotificationOrigin.GENERAL:
                iconNode.src = informationIcon;
                break;
            case NotificationOrigin.SPACESHIP:
                iconNode.src = spaceshipIcon;
                break;
            case NotificationOrigin.EXPLORATION:
                iconNode.src = explorationIcon;
                break;
            case NotificationOrigin.SPACE_STATION:
                iconNode.src = spaceStationIcon;
                break;
        }
        iconNode.classList.add("notification-icon");
        contentContainer.appendChild(iconNode);

        const textNode = doc.createElement("p");
        textNode.textContent = text;
        contentContainer.appendChild(textNode);

        const progress = doc.createElement("div");
        progress.classList.add("notification-progress");

        const progressBar = doc.createElement("div");
        progressBar.classList.add("notification-progress-bar");
        progress.appendChild(progressBar);

        this.htmlRoot.appendChild(progress);

        container.appendChild(this.htmlRoot);

        switch (intent) {
            case NotificationIntent.INFO:
                soundPlayer.playNow(SoundType.INFO);
                break;
            case NotificationIntent.SUCCESS:
                soundPlayer.playNow(SoundType.SUCCESS);
                break;
            case NotificationIntent.WARNING:
                soundPlayer.playNow(SoundType.WARNING);
                break;
            case NotificationIntent.ERROR:
                soundPlayer.playNow(SoundType.ERROR);
                break;
        }

        // animate progress bar
        progressBar.style.animation = `progress ${durationSeconds}s linear`;
        this.progressDurationSeconds = durationSeconds;
    }

    update(deltaSeconds: number): void {
        if (this.progressSeconds < this.progressDurationSeconds) {
            this.progressSeconds += deltaSeconds;
        } else {
            this.removalProgressSeconds += deltaSeconds;
        }
    }

    getProgress(): number {
        return Math.max(0, Math.min(1, this.progressSeconds / this.progressDurationSeconds));
    }

    startRemoval(): void {
        this.isBeingRemoved = true;
        this.htmlRoot.style.animation = `popOut ${this.removalDurationSeconds}s ease-in-out`;
    }

    hasRemovalStarted() {
        return this.isBeingRemoved;
    }

    getRemovalProgress(): number {
        return Math.max(0, Math.min(1, this.removalProgressSeconds / this.removalDurationSeconds));
    }

    dispose(): void {
        this.htmlRoot.remove();
    }
}
