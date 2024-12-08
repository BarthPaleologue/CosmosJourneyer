import { Sounds } from "../assets/sounds";
import explorationIcon from "../../asset/icons/space-exploration.webp";
import spaceshipIcon from "../../asset/icons/spaceship_gear.webp";
import spaceStationIcon from "../../asset/icons/space-station.webp";
import informationIcon from "../../asset/icons/information.webp";

export const enum NotificationOrigin {
    GENERAL = "info",
    SPACESHIP = "spaceship",
    EXPLORATION = "exploration",
    SPACE_STATION = "space-station"
}

export const enum NotificationIntent {
    INFO = "info",
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error"
}

class Notification {
    private progressSeconds = 0;
    private readonly progressDurationSeconds;
    private removalProgressSeconds = 0;
    private readonly removalDurationSeconds = 0.5;

    readonly htmlRoot: HTMLDivElement;

    private isBeingRemoved = false;

    constructor(origin: NotificationOrigin, intent: NotificationIntent, text: string, durationSeconds: number) {
        const container = document.getElementById("notificationContainer");
        if (container === null) throw new Error("No notification container found");

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
                Sounds.MENU_SELECT_SOUND.play();
                break;
            case NotificationIntent.SUCCESS:
                Sounds.ECHOED_BLIP_SOUND.play();
                break;
            case NotificationIntent.WARNING:
                Sounds.MENU_SELECT_SOUND.play();
                break;
            case NotificationIntent.ERROR:
                Sounds.ERROR_BLEEP_SOUND.play();
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
export function createNotification(type: NotificationOrigin, intent: NotificationIntent, text: string, durationMillis: number) {
    const notification = new Notification(type, intent, text, durationMillis / 1000);
    activeNotifications.push(notification);
}

/**
 * Helper function to log a warning if a value is undefined and return a defined value
 * @param value The value to check
 * @param defaultValue The default value to return if the value is undefined
 * @param message The message to log if the value is undefined
 * @returns The value if it is defined, otherwise the default value
 */
export function warnIfUndefined<T>(value: T | undefined, defaultValue: T, message: string): T {
    if (value === undefined) {
        console.warn(message);
        createNotification(NotificationOrigin.GENERAL, NotificationIntent.WARNING, message, 10_000);
        return defaultValue;
    }
    return value;
}
