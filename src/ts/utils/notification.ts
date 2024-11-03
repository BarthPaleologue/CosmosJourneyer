import { Sounds } from "../assets/sounds";

/**
 * Create a notification with a text and a duration (in ms)
 * @param text The text to display
 * @param duration The duration of the notification in ms
 */
export function createNotification(text: string, duration: number) {
    const container = document.getElementById("notificationContainer");
    if (container === null) throw new Error("No notification container found");

    const newNotification = document.createElement("div");
    newNotification.classList.add("notification");

    const textNode = document.createElement("p");
    textNode.textContent = text;

    newNotification.appendChild(textNode);

    const progress = document.createElement("div");
    progress.classList.add("notification-progress");

    const progressBar = document.createElement("div");
    progressBar.classList.add("notification-progress-bar");
    progress.appendChild(progressBar);

    newNotification.appendChild(progress);

    container.appendChild(newNotification);

    Sounds.MENU_SELECT_SOUND.play();

    // animate progress bar
    progressBar.style.animation = `progress ${duration}ms linear`;

    const removeNotification = () => {
        newNotification.style.animation = "popOut 0.5s ease-in-out";
        setTimeout(() => {
            newNotification.remove();
        }, 450);
    };

    const timeOut = setTimeout(removeNotification, duration);

    newNotification.addEventListener("click", () => {
        clearTimeout(timeOut);
        removeNotification();
    });
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
        createNotification(message, 60_000);
        return defaultValue;
    }
    return value;
}
