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

import i18n from "@/i18n";

export function isOfficialGameLocation(location: Pick<Location, "hostname" | "protocol">): boolean {
    return (
        location.protocol === "app:" ||
        location.hostname === "cosmosjourneyer.com" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1" ||
        location.hostname === "::1"
    );
}

export function createOfficialOriginNotice(
    location: Pick<Location, "hostname" | "protocol"> = window.location,
): HTMLElement | null {
    if (isOfficialGameLocation(location)) {
        return null;
    }

    const notice = document.createElement("aside");
    notice.classList.add("officialOriginNotice");
    notice.innerHTML = i18n.t("common:unofficialOriginNotice");
    return notice;
}
