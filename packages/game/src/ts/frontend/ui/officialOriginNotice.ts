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

import type { TFunction } from "i18next";

import { renderMarkdownInline } from "@/utils/markdown";

/** Origin identifying data, decoupled from the DOM's Location. */
type OriginLocation = {
    readonly hostname: string;
    readonly protocol: string;
};

/**
 * Casts the DOM location to the origin contract used by the official-origin checks.
 * @param location - Browser location to convert.
 * @returns The origin data extracted from the location.
 */
function toOriginLocation(location: Location): OriginLocation {
    return { hostname: location.hostname, protocol: location.protocol };
}

/**
 * Checks whether the game is running from its official host or a local app origin.
 * @param location Browser location whose origin is checked.
 * @returns Whether the origin is considered official.
 */
export function isOfficialGameLocation(location: OriginLocation): boolean {
    return (
        location.protocol === "app:" ||
        location.hostname === "cosmosjourneyer.com" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1" ||
        location.hostname === "::1"
    );
}

/**
 * Creates a notice for game instances opened from unofficial web origins.
 * @param t Translation function for the notice content.
 * @param location Browser location to check; defaults to the current page.
 * @returns Notice element for an unofficial origin, or `null` for an official one.
 */
export function createOfficialOriginNotice(
    t: TFunction,
    location: OriginLocation = toOriginLocation(window.location),
): HTMLElement | null {
    if (isOfficialGameLocation(location)) {
        return null;
    }

    const notice = document.createElement("aside");
    notice.classList.add("officialOriginNotice");
    notice.innerHTML = renderMarkdownInline(t("common:unofficialOriginNotice"));
    return notice;
}
