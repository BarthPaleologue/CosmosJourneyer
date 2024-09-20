import { SystemSeed } from "../utils/systemSeed";

export const enum SystemIconMask {
    BOOKMARK = 0b01,
    MISSION = 0b10
}

export class SystemIcons {
    readonly htmlRoot: HTMLElement;

    readonly systemSeed: SystemSeed;

    private readonly bookmarkIcon: HTMLElement;

    private readonly missionIcon: HTMLElement;

    constructor(systemSeed: SystemSeed, iconMask: number) {
        this.systemSeed = systemSeed;

        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("systemIcons");

        this.bookmarkIcon = document.createElement("div");
        this.bookmarkIcon.classList.add("bookmarkIcon");
        this.htmlRoot.appendChild(this.bookmarkIcon);

        this.missionIcon = document.createElement("div");
        this.missionIcon.classList.add("missionIcon");
        this.htmlRoot.appendChild(this.missionIcon);
    }

    dispose() {
        this.htmlRoot.remove();
    }
}
