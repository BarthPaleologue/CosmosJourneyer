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

import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { SpaceStationAssets } from "./spaceStationAssets";

export class SpaceStationNode {
    readonly type: SpaceStationNodeType;
    readonly mesh: AbstractMesh;
    next: SpaceStationNode | null = null;
    readonly sideNodes: SpaceStationNode[];
    readonly index: number;

    constructor(previous: SpaceStationNode | null, type: SpaceStationNodeType, attachmentType: AttachmentType) {
        this.type = type;
        if(previous !== null) {
            previous.next = this;
            this.index = previous.index + 1;
        } else {
            this.index = 0;
        }

        this.sideNodes = [];

        switch (type) {
            case SpaceStationNodeType.SQUARE_SECTION:
                this.mesh = SpaceStationAssets.SQUARE_SECTION.createInstance("SquareSection");
                this.mesh.scalingDeterminant = 0.9 + Math.random() * 0.2;
                this.mesh.scaling.y = 5;
                break;
            case SpaceStationNodeType.RING_HABITAT:
                this.mesh = SpaceStationAssets.RING_HABITAT.createInstance("RingHabitat");
                this.mesh.scalingDeterminant = 1e3 + (Math.random() - 0.5) * 1e3;
                break;
            case SpaceStationNodeType.SOLAR_PANEL:
                this.mesh = SpaceStationAssets.SOLAR_PANEL.createInstance("SolarPanel");
                this.mesh.scalingDeterminant = 4;
                break;
        }

        if (previous !== null) {
            if (attachmentType === AttachmentType.NEXT) {
                const previousSectionSizeY = previous.mesh.getBoundingInfo().boundingBox.extendSize.y * previous.mesh.scalingDeterminant * previous.mesh.scaling.y;
                const newSectionY = this.mesh.getBoundingInfo().boundingBox.extendSize.y * this.mesh.scalingDeterminant * this.mesh.scaling.y;

                this.mesh.position = previous.mesh.position.add(previous.mesh.up.scale(previousSectionSizeY + newSectionY));
            } else if (attachmentType === AttachmentType.SIDE) {
                const previousSectionSizeX = previous.mesh.getBoundingInfo().boundingBox.extendSize.x * previous.mesh.scalingDeterminant * previous.mesh.scaling.x;
                const newSectionX = this.mesh.getBoundingInfo().boundingBox.extendSize.x * this.mesh.scalingDeterminant * this.mesh.scaling.x;

                this.mesh.position = previous.mesh.position.add(previous.mesh.right.scale(previousSectionSizeX + newSectionX));
            }
        }
    }
}

export const enum SpaceStationNodeType {
    SQUARE_SECTION,
    RING_HABITAT,
    SOLAR_PANEL
}

export const enum AttachmentType {
    NEXT,
    SIDE
}
