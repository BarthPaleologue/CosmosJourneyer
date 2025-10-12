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

import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";

export function createCircle(radius: number, nbPoints: number) {
    const buffer = new Float32Array(16 * nbPoints);

    for (let i = 0; i < nbPoints; i++) {
        const theta = (2 * Math.PI * i) / nbPoints;
        const position = new Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta));

        const matrix = Matrix.Compose(
            Vector3.OneReadOnly,
            Quaternion.FromLookDirectionRH(new Vector3(-position.x, 0, -position.z).normalize(), Vector3.UpReadOnly),
            position,
        );
        matrix.copyToArray(buffer, i * 16);
    }

    return buffer;
}
