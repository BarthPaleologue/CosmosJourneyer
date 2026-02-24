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

import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";

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

        modal.addEventListener("reset", () => {
            soundPlayer.playNow("click");
            resolve(null);
            modal.remove();
        });

        modal.addEventListener("close", () => {
            soundPlayer.playNow("click");
            if (modal.returnValue === "ok") {
                resolve(input.value);
            } else {
                resolve(null);
            }
            modal.remove();
        });
    });
}
