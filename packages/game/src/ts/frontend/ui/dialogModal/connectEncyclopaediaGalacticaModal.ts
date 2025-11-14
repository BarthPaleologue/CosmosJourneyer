//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";

import i18n from "@/i18n";

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
