//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { assertUnreachable } from "@cosmos-journeyer/typescript";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { StationSectionModel } from "@cosmos-journeyer/universe-model";

import { EngineBay } from "@/frontend/assets/procedural/spaceStation/engineBay";
import { CylinderHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/cylinder/cylinderHabitat";
import { HelixHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/helix/helixHabitat";
import { RingHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/ring/ringHabitat";
import { LandingBay } from "@/frontend/assets/procedural/spaceStation/landingBay/landingBay";
import { SolarSection } from "@/frontend/assets/procedural/spaceStation/solarSection";
import { TokamakSection } from "@/frontend/assets/procedural/spaceStation/tokamakSection";
import { UtilitySection } from "@/frontend/assets/procedural/spaceStation/utilitySection";
import type { RenderingAssets } from "@/frontend/assets/renderingAssets";
import type { StationSection } from "@/frontend/universe/orbitalFacility/stationSection";

/**
 * Instantiates the ordered station sections and attaches each one to the facility hierarchy.
 * @param root - The facility root transform that will own the generated sections.
 * @param models - The ordered section models that define the facility layout.
 * @param displayName - The localized name used for this facility section.
 * @param assets - The loaded models and textures needed by the facility sections.
 * @param scene - The Babylon.js scene that owns the rendered meshes.
 * @param initialSupport - The initial landing-pad support section to build.
 * @returns The facility sections attached to the root transform.
 */
export function createFacilitySections(
    root: TransformNode,
    models: DeepReadonly<Array<StationSectionModel>>,
    displayName: string,
    assets: RenderingAssets,
    scene: Scene,
    initialSupport?: TransformNode,
): Array<StationSection> {
    const sections: Array<StationSection> = [];
    for (const section of models) {
        const newSection = getSectionFromModel(section, displayName, assets, scene);
        const lastNode = sections.at(-1)?.getTransform() ?? initialSupport;
        if (lastNode !== undefined) {
            placeNode(newSection.getTransform(), lastNode);
        }

        sections.push(newSection);
        newSection.getTransform().parent = root;
    }

    return sections;
}

/**
 * Moves a station section so its lower bound rests on top of its parent section.
 * @param node - The facility section transform to place on top of its parent.
 * @param parent - The facility transform that supports the new section.
 */
function placeNode(node: TransformNode, parent: TransformNode): void {
    // Make sure bounds are current
    parent.computeWorldMatrix(true);
    node.computeWorldMatrix(true);

    const parentBV = parent.getHierarchyBoundingVectors();
    const nodeBV = node.getHierarchyBoundingVectors();

    const deltaY = parentBV.max.y - nodeBV.min.y; // bring node bottom to parent top

    node.translate(Axis.Y, deltaY, Space.WORLD);
}

/**
 * Creates the station-section implementation selected by the model variant.
 * @param sectionModel - The model describing this facility section.
 * @param displayName - The localized name used for this facility section.
 * @param assets - The loaded models and textures needed by the facility sections.
 * @param scene - The Babylon.js scene that owns the rendered meshes.
 * @returns The instantiated section node.
 */
function getSectionFromModel(
    sectionModel: DeepReadonly<StationSectionModel>,
    displayName: string,
    assets: RenderingAssets,
    scene: Scene,
): StationSection {
    switch (sectionModel.type) {
        case "engineBay":
            return new EngineBay(assets, scene);
        case "utility":
            return new UtilitySection(sectionModel, assets, scene);
        case "solar":
            return new SolarSection(sectionModel, assets, scene);
        case "fusion":
            return new TokamakSection(sectionModel, assets, scene);
        case "cylinderHabitat":
            return new CylinderHabitat(sectionModel, assets.textures, scene);
        case "ringHabitat":
            return new RingHabitat(sectionModel, assets.textures, scene);
        case "helixHabitat":
            return new HelixHabitat(sectionModel, assets.textures, scene);
        case "landingBay": {
            return new LandingBay(sectionModel, displayName, assets, scene);
        }
        default:
            return assertUnreachable(sectionModel);
    }
}
