import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";

import i18n from "@/i18n";

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
