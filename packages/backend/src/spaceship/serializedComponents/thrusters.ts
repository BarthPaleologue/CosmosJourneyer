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

import { z } from "zod";

export const SerializedThrustersSchema = z.object({
    type: z.literal("thrusters"),
    size: z.number(),
    quality: z.number(),
});

export type SerializedThrusters = z.infer<typeof SerializedThrustersSchema>;

export function getThrustersSpec(serializedThrusters: SerializedThrusters) {
    return {
        maxSpeed: 1e3 * (1.0 + serializedThrusters.size / 7.0 + serializedThrusters.quality / 20.0),
    };
}
