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

class Notification {
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
    ) {
        let container = document.getElementById("notificationContainer");
        if (container === null) {
            container = document.createElement("div");
            container.id = "notificationContainer";
            document.body.appendChild(container);
        }

        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("notification", origin);

        const contentContainer = document.createElement("div");
        contentContainer.classList.add("notification-content");
        this.htmlRoot.appendChild(contentContainer);

        const iconNode = document.createElement("img");
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

        const textNode = document.createElement("p");
        textNode.textContent = text;
        contentContainer.appendChild(textNode);

        const progress = document.createElement("div");
        progress.classList.add("notification-progress");

        const progressBar = document.createElement("div");
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

let activeNotifications: Notification[] = [];

export function updateNotifications(deltaSeconds: number): void {
    activeNotifications.forEach((notification) => {
        notification.update(deltaSeconds);
        if (notification.getProgress() === 1 && !notification.hasRemovalStarted()) {
            notification.startRemoval();
        }
        if (notification.getRemovalProgress() === 1) {
            notification.dispose();
        }
    });

    activeNotifications = activeNotifications.filter((notification) => notification.getRemovalProgress() < 1);
}

/**
 * Create a notification with a text and a duration (in ms)
 * @param text The text to display
 * @param durationMillis The duration of the notification in ms
 */
export function createNotification(
    type: NotificationOrigin,
    intent: NotificationIntent,
    text: string,
    durationMillis: number,
    soundPlayer: ISoundPlayer,
) {
    const notification = new Notification(type, intent, text, durationMillis / 1000, soundPlayer);
    activeNotifications.push(notification);
}
