import { StarSystemCoordinates, starSystemCoordinatesEquals } from "../saveFile/universeCoordinates";

export const enum SystemIconMask {
    BOOKMARK = 0b01,
    MISSION = 0b10
}

export class SystemIcons {
    readonly htmlRoot: HTMLElement;

    readonly systemCoordinates: StarSystemCoordinates;

    private readonly bookmarkIcon: HTMLElement;

    private readonly missionIcon: HTMLElement;

    constructor(starSystemCoordinates: StarSystemCoordinates, iconMask: number) {
        this.systemCoordinates = starSystemCoordinates;

        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("systemIcons");

        this.bookmarkIcon = document.createElement("div");
        this.bookmarkIcon.classList.add("bookmarkIcon");
        if (iconMask & SystemIconMask.BOOKMARK) {
            this.htmlRoot.appendChild(this.bookmarkIcon);
        }

        this.missionIcon = document.createElement("div");
        this.missionIcon.classList.add("missionIcon");
        if (iconMask & SystemIconMask.MISSION) {
            this.htmlRoot.appendChild(this.missionIcon);
        }
    }

    update(iconMask: number): void {
        if (iconMask & SystemIconMask.BOOKMARK) {
            this.htmlRoot.appendChild(this.bookmarkIcon);
        } else {
            this.bookmarkIcon.remove();
        }

        if (iconMask & SystemIconMask.MISSION) {
            this.htmlRoot.appendChild(this.missionIcon);
        } else {
            this.missionIcon.remove();
        }
    }

    dispose() {
        this.htmlRoot.remove();
    }

    static IconMaskForSystem(system: StarSystemCoordinates, bookmarkedSystems: StarSystemCoordinates[], targetSystems: StarSystemCoordinates[]): number {
        let iconMask = 0;
        if (bookmarkedSystems.find((bookmarkedSystem) => starSystemCoordinatesEquals(bookmarkedSystem, system))) iconMask |= SystemIconMask.BOOKMARK;
        if (targetSystems.find((targetSystem) => starSystemCoordinatesEquals(targetSystem, system))) iconMask |= SystemIconMask.MISSION;
        return iconMask;
    }
}
