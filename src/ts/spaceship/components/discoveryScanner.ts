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

import { getDiscoveryScannerSpec, SerializedDiscoveryScanner } from "../serializedComponents/discoveryScanner";

export class DiscoveryScanner {
    readonly type;
    readonly range: number;

    readonly size: number;
    readonly quality: number;

    constructor(serializedDiscoveryScanner: SerializedDiscoveryScanner) {
        this.type = serializedDiscoveryScanner.type;
        this.size = serializedDiscoveryScanner.size;
        this.quality = serializedDiscoveryScanner.quality;

        const spec = getDiscoveryScannerSpec(serializedDiscoveryScanner);

        this.range = spec.range;
    }

    serialize() {
        return {
            type: this.type,
            size: this.size,
            quality: this.quality
        };
    }
}
