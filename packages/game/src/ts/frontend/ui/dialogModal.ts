import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";

import type { NonEmptyArray } from "@/utils/types";

import i18n from "@/i18n";
import { Settings } from "@/settings";

export function radialChoiceModal<T>(
    choices: NonEmptyArray<T>,
    toString: (value: T) => string,
    soundPlayer: ISoundPlayer,
): Promise<T | null> {
    let resolveChoice!: (value: T | null) => void;
    const promise = new Promise<T | null>((res) => {
        resolveChoice = res;
    });

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(0, 0, 0, 0.5)";
    overlay.style.zIndex = "1000";
    overlay.style.pointerEvents = "auto";
    overlay.style.backdropFilter = "blur(1px)";
    overlay.tabIndex = -1;

    const circleSize = 500;
    const buttonRadius = circleSize / 2 - 70;

    const circle = document.createElement("div");
    circle.style.position = "relative";
    circle.style.width = `${circleSize}px`;
    circle.style.height = `${circleSize}px`;
    circle.style.borderRadius = "50%";
    circle.style.boxShadow = "0 0 25px rgba(0, 0, 0, 0.6)";
    circle.style.display = "flex";
    circle.style.alignItems = "center";
    circle.style.justifyContent = "center";
    overlay.appendChild(circle);

    const currentLabel = document.createElement("div");
    currentLabel.style.color = "white";
    currentLabel.style.fontFamily = Settings.MAIN_FONT;
    currentLabel.style.fontSize = "2em";
    currentLabel.style.textAlign = "center";
    currentLabel.style.pointerEvents = "none";
    currentLabel.style.maxWidth = "60%";
    circle.appendChild(currentLabel);

    const buttons: HTMLButtonElement[] = [];
    const buttonOffsets: Array<{ x: number; y: number }> = [];
    const angleStep = (Math.PI * 2) / choices.length;
    const center = circleSize / 2;
    let selectedIndex = 0;

    const getChoice = (index: number): T => choices[index] ?? choices[0];

    const setSelectedIndex = (index: number) => {
        selectedIndex = (index + choices.length) % choices.length;
        buttons.forEach((button, idx) => {
            const isActive = idx === selectedIndex;
            button.style.transform = isActive ? "translate(-50%, -50%) scale(1.08)" : "translate(-50%, -50%)";
            button.classList.toggle("active", isActive);
        });
        currentLabel.textContent = toString(getChoice(selectedIndex));
    };

    const cleanup = () => {
        overlay.removeEventListener("keydown", handleKeydown);
        overlay.removeEventListener("click", handleOverlayClick);
        overlay.removeEventListener("mousemove", handleMouseMove);
        if (overlay.isConnected) {
            overlay.remove();
        }
    };

    let hasSettled = false;

    const finish = (result: T | null) => {
        if (hasSettled) {
            return;
        }
        hasSettled = true;
        cleanup();
        soundPlayer.playNow(SoundType.CLICK);
        resolveChoice(result);
    };

    const handleOverlayClick = () => {
        finish(getChoice(selectedIndex));
    };

    const handleKeydown = (event: KeyboardEvent) => {
        event.stopPropagation();
        if (event.key === "Escape") {
            event.preventDefault();
            finish(null);
        }
    };

    const handleMouseMove = (event: MouseEvent) => {
        const rect = circle.getBoundingClientRect();
        const pointerX = event.clientX - (rect.left + rect.width / 2);
        const pointerY = event.clientY - (rect.top + rect.height / 2);
        let closestIndex = 0;
        let closestDistanceSq = Number.POSITIVE_INFINITY;
        buttonOffsets.forEach((offset, idx) => {
            const dx = pointerX - offset.x;
            const dy = pointerY - offset.y;
            const distanceSq = dx * dx + dy * dy;
            if (distanceSq < closestDistanceSq) {
                closestDistanceSq = distanceSq;
                closestIndex = idx;
            }
        });
        if (closestIndex !== selectedIndex) {
            setSelectedIndex(closestIndex);
        }
    };

    for (const [index, choice] of choices.entries()) {
        const angle = angleStep * index - Math.PI / 2;
        const offsetX = Math.cos(angle) * buttonRadius;
        const offsetY = Math.sin(angle) * buttonRadius;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = toString(choice);
        button.style.position = "absolute";
        button.style.left = `${center + offsetX}px`;
        button.style.top = `${center + offsetY}px`;
        button.style.transform = "translate(-50%, -50%) scale(1)";
        button.style.padding = "8px 16px";
        button.style.borderRadius = "999px";
        button.style.transition = "transform 0.1s ease-in-out, background 0.1s ease";
        button.style.fontSize = "1.5em";
        button.style.lineHeight = "1.5em";
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            finish(choice);
        });
        button.addEventListener("mouseenter", () => {
            setSelectedIndex(index);
        });
        buttons.push(button);
        buttonOffsets.push({ x: offsetX, y: offsetY });
        circle.appendChild(button);
    }

    document.body.appendChild(overlay);
    overlay.focus({ preventScroll: true });
    overlay.addEventListener("click", handleOverlayClick);
    overlay.addEventListener("keydown", handleKeydown);
    overlay.addEventListener("mousemove", handleMouseMove);
    setSelectedIndex(0);

    return promise;
}

export function promptModalString(
    prompt: string,
    defaultValue: string,
    soundPlayer: ISoundPlayer,
): Promise<string | null> {
    const modal = document.createElement("dialog");
    modal.innerHTML = `
        <form method="dialog">
            <p>${prompt}</p>
            <input type="text" value="${defaultValue}">
            <menu>
                <button type="reset" value="cancel">${i18n.t("common:cancel")}</button>
                <button type="submit" value="ok">${i18n.t("common:ok")}</button>
            </menu>
        </form>
    `;
    document.body.appendChild(modal);
    modal.showModal();

    return new Promise((resolve) => {
        const input = modal.querySelector("input") as HTMLInputElement;
        input.focus();
        input.select();
        input.addEventListener("keydown", (e) => {
            e.stopPropagation();
        });

        // on reset, close the modal and resolve with null
        modal.addEventListener("reset", () => {
            soundPlayer.playNow(SoundType.CLICK);
            resolve(null);
            modal.remove();
        });

        modal.addEventListener("close", () => {
            soundPlayer.playNow(SoundType.CLICK);
            if (modal.returnValue === "ok") {
                resolve(input.value);
            } else {
                resolve(null);
            }
            modal.remove();
        });
    });
}

export function promptModalBoolean(prompt: string, soundPlayer: ISoundPlayer): Promise<boolean> {
    const modal = document.createElement("dialog");
    modal.innerHTML = `
        <form method="dialog">
            <p>${prompt}</p>
            <menu>
                <button value="cancel">${i18n.t("common:cancel")}</button>
                <button value="ok">${i18n.t("common:confirm")}</button>
            </menu>
        </form>
    `;
    document.body.appendChild(modal);
    modal.showModal();

    return new Promise((resolve) => {
        modal.addEventListener("close", () => {
            soundPlayer.playNow(SoundType.CLICK);
            resolve(modal.returnValue === "ok");
            modal.remove();
        });
    });
}

export function alertModal(message: string, soundPlayer: ISoundPlayer): Promise<void> {
    const modal = document.createElement("dialog");
    modal.innerHTML = `
        <form method="dialog">
            <p>${message}</p>
            <menu>
                <button value="ok">${i18n.t("common:ok")}</button>
            </menu>
        </form>
    `;
    document.body.appendChild(modal);
    modal.showModal();

    return new Promise((resolve) => {
        modal.addEventListener("close", () => {
            soundPlayer.playNow(SoundType.CLICK);
            resolve();
            modal.remove();
        });
    });
}

export function connectEncyclopaediaGalacticaModal(soundPlayer: ISoundPlayer): Promise<{
    encyclopaediaUrlBase: string;
    accountId: string;
    password: string;
} | null> {
    const modal = document.createElement("dialog");
    document.body.appendChild(modal);

    const form = document.createElement("form");
    form.method = "dialog";
    form.classList.add("flex-column");
    modal.appendChild(form);

    const description = document.createElement("p");
    description.textContent = "Connect to an instance of the Encyclopaedia";
    form.appendChild(description);

    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.placeholder = "https://cosmosjourneyer.com/encyclopaediaTest/";
    urlInput.required = true;
    form.appendChild(urlInput);

    const accountIdInput = document.createElement("input");
    accountIdInput.type = "text";
    accountIdInput.placeholder = "accountId";
    form.appendChild(accountIdInput);

    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.placeholder = "password";
    form.appendChild(passwordInput);

    const menu = document.createElement("menu");
    form.appendChild(menu);

    const cancelButton = document.createElement("button");
    cancelButton.type = "reset";
    cancelButton.value = "cancel";
    cancelButton.textContent = i18n.t("common:cancel");
    menu.appendChild(cancelButton);

    const connectButton = document.createElement("button");
    connectButton.type = "submit";
    connectButton.value = "connect";
    connectButton.textContent = "Connect";
    menu.appendChild(connectButton);

    modal.showModal();

    urlInput.focus();
    urlInput.select();
    modal.querySelectorAll("input").forEach((input) => {
        input.addEventListener("keydown", (e) => {
            e.stopPropagation();
        });
    });

    return new Promise((resolve) => {
        // on reset, close the modal and resolve with null
        modal.addEventListener("reset", () => {
            soundPlayer.playNow(SoundType.CLICK);
            resolve(null);
            modal.remove();
        });

        modal.addEventListener("close", () => {
            soundPlayer.playNow(SoundType.CLICK);
            if (modal.returnValue === "connect") {
                resolve({
                    encyclopaediaUrlBase: urlInput.value,
                    accountId: accountIdInput.value,
                    password: passwordInput.value,
                });
            } else {
                resolve(null);
            }
            modal.remove();
        });
    });
}
