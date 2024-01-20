//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

export function clearAllEventListenersById(id: string): HTMLElement {
    const oldElement = document.getElementById(id);
    if (oldElement === null) throw new Error(`Could not find #${id} in document`);
    const newElement = oldElement.cloneNode(true);
    (oldElement.parentNode as HTMLElement).replaceChild(newElement, oldElement);
    return document.getElementById(id) as HTMLElement;
}

export function show(id: string, condition = true) {
    if (condition) (document.getElementById(id) as HTMLElement).hidden = false;
    else hide(id);
}

export function hide(id: string) {
    (document.getElementById(id) as HTMLElement).hidden = true;
}
