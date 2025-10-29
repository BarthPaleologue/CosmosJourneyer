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

import { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";

import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";
import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { wrapVector3 } from "@/frontend/helpers/algebra";

import { type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

export function vector3ToString(v: Vector3): string {
    return `${v.x},${v.y},${v.z}`;
}

export type BuildData = {
    coordinates: StarSystemCoordinates;
    sectorString: string;
    position: Vector3;
};

export class StarSectorView {
    /**
     * The star instances of the sector
     */
    readonly starInstances: InstancedMesh[] = [];

    readonly blackHoleInstances: InstancedMesh[] = [];

    readonly coordinates: Vector3;

    /**
     * The position of the sector relative to the center of the starmap
     */
    readonly position: Vector3;

    readonly systems: ReadonlyArray<{
        model: DeepReadonly<StarSystemModel>;
        position: Vector3;
    }>;

    constructor(coordinates: Vector3, universeBackend: UniverseBackend) {
        this.coordinates = coordinates;
        this.position = coordinates.scale(Settings.STAR_SECTOR_SIZE);

        const systemModels = universeBackend.getSystemModelsInStarSector(
            this.coordinates.x,
            this.coordinates.y,
            this.coordinates.z,
        );
        this.systems = systemModels.map((systemModel) => {
            return {
                model: systemModel,
                position: wrapVector3(universeBackend.getSystemGalacticPosition(systemModel.coordinates)),
            };
        });
    }

    generate(): BuildData[] {
        const sectorString = this.getKey();
        return this.systems.map(({ model, position }) => {
            return {
                coordinates: model.coordinates,
                sectorString: sectorString,
                position: position,
            };
        });
    }

    /**
     * Returns a string that uniquely identifies this sector (its position relative to the global node)
     * @returns a string that uniquely identifies this sector
     */
    getKey(): string {
        return vector3ToString(this.coordinates);
    }

    static GetBoundingBox(position: Vector3): BoundingBox {
        return new BoundingBox(
            new Vector3(-1, -1, -1).scaleInPlace(Settings.STAR_SECTOR_SIZE / 2),
            new Vector3(1, 1, 1).scaleInPlace(Settings.STAR_SECTOR_SIZE / 2),
            Matrix.Translation(position.x, position.y, position.z),
        );
    }
}
