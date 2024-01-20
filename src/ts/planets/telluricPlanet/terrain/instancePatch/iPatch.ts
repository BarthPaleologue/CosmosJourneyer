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

import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

export interface IPatch {
    /**
     * Clears all instances from the patch. They will be disposed and will not render anymore.
     * The copy of the given base mesh will also be disposed.
     * The matrix buffer will be kept though, which means that calling createInstances() will reuse the same buffer.
     */
    clearInstances(): void;

    /**
     * Creates instances of a copy of the given base mesh (or transform node in the case of HierarchyInstancePatch).
     * The instances will be positioned according to the matrix buffer given in the constructor.
     * @param baseMesh The mesh to create instances from.
     * @throws Error if baseMesh is not a Mesh in the case of InstancePatch and ThinInstancePatch.
     */
    createInstances(baseMesh: TransformNode): void;

    /**
     * Returns the number of instances currently rendered.
     */
    getNbInstances(): number;

    setEnabled(enabled: boolean): void;

    /**
     * Disposes the patch and all its instances and buffers.
     */
    dispose(): void;
}
