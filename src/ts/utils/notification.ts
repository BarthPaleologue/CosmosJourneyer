import { Sounds } from "../assets/sounds";

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

    setTimeout(() => {
        newNotification.style.animation = "popOut 0.5s ease-in-out";
        setTimeout(() => {
            newNotification.remove();
        }, 500);
    }, duration);
}
