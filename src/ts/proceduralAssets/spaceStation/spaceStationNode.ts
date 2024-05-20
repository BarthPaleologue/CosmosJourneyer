//  This file is part of Cosmos Journeyer
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

import { SpaceStationAssets } from "./spaceStationAssets";
import { createHelix } from "../../utils/helixBuilder";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Transformable } from "../../architecture/transformable";

export class SpaceStationNode implements Transformable {
    readonly type: SpaceStationNodeType;
    readonly transform: TransformNode;
    next: SpaceStationNode | null = null;
    readonly sideNodes: SpaceStationNode[];
    readonly index: number;

    constructor(previous: SpaceStationNode | null, type: SpaceStationNodeType, attachmentType: AttachmentType, scene: Scene) {
        this.type = type;
        if (previous !== null) {
            switch (attachmentType) {
                case AttachmentType.NEXT:
                    previous.next = this;
                    this.index = previous.index + 1;
                    break;
                case AttachmentType.SIDE:
                    previous.sideNodes.push(this);
                    this.index = previous.index;
                    break;
            }
        } else {
            this.index = 0;
        }

        this.sideNodes = [];

        switch (type) {
            case SpaceStationNodeType.SQUARE_SECTION:
                this.transform = SpaceStationAssets.SQUARE_SECTION.createInstance("SquareSection");
                this.transform.scalingDeterminant = 0.9 + Math.random() * 0.2;
                this.transform.scaling.y = 5;
                break;
            case SpaceStationNodeType.RING_HABITAT:
                this.transform = SpaceStationAssets.RING_HABITAT.createInstance("RingHabitat");
                this.transform.scalingDeterminant = 1e3 + (Math.random() - 0.5) * 1e3;
                break;
            case SpaceStationNodeType.HELIX_HABITAT:
                this.transform = createHelix("HelixHabitat", { radius: 2e3, tubeDiameter: 100, tessellation: 32, pitch: 1e3, spires: 4 }, scene);
                break;
            case SpaceStationNodeType.SOLAR_PANEL:
                this.transform = SpaceStationAssets.SOLAR_PANEL.createInstance("SolarPanel");
                this.transform.scalingDeterminant = 4;
                break;
            case SpaceStationNodeType.SPHERICAL_TANK:
                this.transform = SpaceStationAssets.SPHERICAL_TANK.createInstance("SphericalTank");
                this.transform.scalingDeterminant = 5;
                break;
        }

        if (previous !== null) {
            const previousBoundingVectors = previous.transform.getHierarchyBoundingVectors();
            const previousBoundingExtendSize = previousBoundingVectors.max.subtract(previousBoundingVectors.min).scale(0.5);

            const newBoundingVectors = this.transform.getHierarchyBoundingVectors();
            const newBoundingExtendSize = newBoundingVectors.max.subtract(newBoundingVectors.min).scale(0.5);

            if (attachmentType === AttachmentType.NEXT) {
                const previousSectionSizeY = previousBoundingExtendSize.y;
                const newSectionY = newBoundingExtendSize.y;

                this.transform.position = previous.transform.position.add(previous.transform.up.scale(previousSectionSizeY + newSectionY));
            } else if (attachmentType === AttachmentType.SIDE) {
                const previousSectionSizeX = previousBoundingExtendSize.x;
                const newSectionX = newBoundingExtendSize.x;

                this.transform.position = previous.transform.position.add(previous.transform.right.scale(previousSectionSizeX + newSectionX));
            }
        }
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    dispose() {
        this.transform.dispose();
    }
}

export const enum SpaceStationNodeType {
    SQUARE_SECTION,
    RING_HABITAT,
    HELIX_HABITAT,
    SOLAR_PANEL,
    SPHERICAL_TANK
}

export const enum AttachmentType {
    NEXT,
    SIDE
}
