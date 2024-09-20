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
        if(iconMask & SystemIconMask.BOOKMARK) {
            this.htmlRoot.appendChild(this.bookmarkIcon);
        }

        this.missionIcon = document.createElement("div");
        this.missionIcon.classList.add("missionIcon");
        if(iconMask & SystemIconMask.MISSION) {
            this.htmlRoot.appendChild(this.missionIcon);
        }
    }

    update(iconMask: number): void {
        if(iconMask & SystemIconMask.BOOKMARK) {
            this.htmlRoot.appendChild(this.bookmarkIcon);
        } else {
            this.bookmarkIcon.remove();
        }

        if(iconMask & SystemIconMask.MISSION) {
            this.htmlRoot.appendChild(this.missionIcon);
        } else {
            this.missionIcon.remove();
        }
    }

    dispose() {
        this.htmlRoot.remove();
    }

    static IconMaskForSystem(system: SystemSeed, bookmarkedSystems: SystemSeed[], targetSystems: SystemSeed[]): number {
        let iconMask = 0;
        if (bookmarkedSystems.includes(system)) iconMask |= SystemIconMask.BOOKMARK;
        if (targetSystems.includes(system)) iconMask |= SystemIconMask.MISSION;
        return iconMask;
    }
}
