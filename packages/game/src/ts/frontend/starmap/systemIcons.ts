import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";

export const enum SystemIconMask {
    BOOKMARK = 0b01,
    MISSION = 0b10,
}

export class SystemIcons {
    readonly htmlRoot: HTMLElement;

    private systemCoordinates: StarSystemCoordinates;

    private readonly bookmarkIcon: HTMLElement;

    private readonly missionIcon: HTMLElement;

    private iconMask: number;

    constructor(starSystemCoordinates: StarSystemCoordinates, iconMask: number) {
        this.systemCoordinates = starSystemCoordinates;

        this.iconMask = iconMask;

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

    update(systemCoordinates: StarSystemCoordinates, iconMask: number): void {
        this.systemCoordinates = systemCoordinates;

        const doesDisplayBookmark = this.iconMask & SystemIconMask.BOOKMARK;
        const shouldDisplayBookmark = iconMask & SystemIconMask.BOOKMARK;

        if (shouldDisplayBookmark && !doesDisplayBookmark) {
            this.htmlRoot.appendChild(this.bookmarkIcon);
        } else if (!shouldDisplayBookmark && doesDisplayBookmark) {
            this.bookmarkIcon.remove();
        }

        const doesDisplayMission = this.iconMask & SystemIconMask.MISSION;
        const shouldDisplayMission = iconMask & SystemIconMask.MISSION;

        if (shouldDisplayMission && !doesDisplayMission) {
            this.htmlRoot.appendChild(this.missionIcon);
        } else if (!shouldDisplayMission && doesDisplayMission) {
            this.missionIcon.remove();
        }

        this.iconMask = iconMask;
    }

    getSystemCoordinates(): StarSystemCoordinates {
        return this.systemCoordinates;
    }

    dispose() {
        this.htmlRoot.remove();
    }

    static IconMaskForSystem(
        system: StarSystemCoordinates,
        bookmarkedSystems: StarSystemCoordinates[],
        targetSystems: StarSystemCoordinates[],
    ): number {
        let iconMask = 0;
        if (bookmarkedSystems.find((bookmarkedSystem) => starSystemCoordinatesEquals(bookmarkedSystem, system)))
            iconMask |= SystemIconMask.BOOKMARK;
        if (targetSystems.find((targetSystem) => starSystemCoordinatesEquals(targetSystem, system)))
            iconMask |= SystemIconMask.MISSION;
        return iconMask;
    }
}
