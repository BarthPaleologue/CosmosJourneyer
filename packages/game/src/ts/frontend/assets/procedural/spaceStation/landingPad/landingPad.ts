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

import { type SpotLight } from "@babylonjs/core/Lights/spotLight";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type Mesh } from "@babylonjs/core/Meshes";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type Scene } from "@babylonjs/core/scene";

import type { Textures } from "@/frontend/assets/textures";
import { lookAt } from "@/frontend/helpers/transform";
import { ObjectTargetCursorType, type TargetInfo } from "@/frontend/universe/architecture/targetable";
import { type ILandingPad, type LandingPadSize } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { degreesToRadians } from "@/utils/physics/unitConversions";

import i18n from "@/i18n";
import { CollisionMask, Settings } from "@/settings";

import { ProceduralSpotLight } from "../../spotLight";
import { LandingPadMaterial } from "./landingPadMaterial";

export class LandingPad implements ILandingPad {
    private readonly deck: Mesh;
    private deckAggregate: PhysicsAggregate | null = null;

    private spotLights: Array<ProceduralSpotLight>;

    private readonly deckMaterial: LandingPadMaterial;

    readonly padNumber: number;
    private readonly padSize: LandingPadSize;

    private readonly boundingRadius: number;

    readonly targetInfo: TargetInfo;

    readonly padHeight = 0.5;

    private readonly width: number;
    private readonly depth: number;

    constructor(padNumber: number, padSize: LandingPadSize, textures: Textures, scene: Scene) {
        this.padSize = padSize;

        this.width = 40 * padSize;
        this.depth = this.width * Settings.LANDING_PAD_ASPECT_RATIO;

        this.boundingRadius = this.depth / 2;

        this.padNumber = padNumber;

        this.deckMaterial = new LandingPadMaterial(
            padNumber,
            textures.materials.concrete,
            textures.pools.landingPad,
            scene,
        );

        this.deck = MeshBuilder.CreateBox(
            `Landing Pad ${padNumber}`,
            {
                width: this.width,
                depth: this.depth,
                height: this.padHeight,
            },
            scene,
        );
        this.deck.material = this.deckMaterial;

        this.enablePhysics(scene);

        this.targetInfo = {
            type: ObjectTargetCursorType.LANDING_PAD,
            minDistance: this.getBoundingRadius() * 4.0,
            maxDistance: this.getBoundingRadius() * 6.0,
        };

        const lightHeight = 20;
        const lightInset = Math.min(2, Math.min(this.width, this.depth) * 0.05);
        const halfWidth = this.width / 2 - lightInset;
        const halfDepth = this.depth / 2 - lightInset;
        const corners: ReadonlyArray<{ x: number; z: number }> = [
            { x: halfWidth, z: halfDepth },
            { x: -halfWidth, z: halfDepth },
            { x: -halfWidth, z: -halfDepth },
            { x: halfWidth, z: -halfDepth },
        ];

        const sceneUsesRightHanded = scene.useRightHandedSystem;

        this.spotLights = corners.map((corner) => {
            const proceduralSpotLight = new ProceduralSpotLight(
                degreesToRadians(120),
                this.padSize * 0.6,
                this.depth,
                scene,
            );
            proceduralSpotLight.getTransform().position.set(corner.x, lightHeight, corner.z);
            proceduralSpotLight.getTransform().parent = this.getTransform();
            lookAt(proceduralSpotLight.getTransform(), Vector3.Zero(), sceneUsesRightHanded);

            const lampPost = MeshBuilder.CreateCylinder(
                "Lamp Post",
                {
                    diameter: 0.3,
                    height: lightHeight,
                },
                scene,
            );
            lampPost.position.set(corner.x, lightHeight / 2, corner.z);
            lampPost.parent = this.getTransform();

            const lampPostMaterial = new PBRMetallicRoughnessMaterial("LampPostMaterial", scene);
            lampPostMaterial.metallic = 1;
            lampPostMaterial.roughness = 0.4;
            lampPost.material = lampPostMaterial;

            return proceduralSpotLight;
        });
    }

    disablePhysics() {
        if (this.deckAggregate === null) {
            return;
        }

        this.deckAggregate.dispose();
        this.deckAggregate = null;
    }

    enablePhysics(scene: Scene) {
        if (this.deckAggregate !== null) {
            return;
        }

        this.deckAggregate = new PhysicsAggregate(this.deck, PhysicsShapeType.BOX, { mass: 0, friction: 10 }, scene);
        this.deckAggregate.body.disablePreStep = false;
        this.deckAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        this.deckAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;
    }

    getPadNumber(): number {
        return this.padNumber;
    }

    getPadSize(): LandingPadSize {
        return this.padSize;
    }

    getPadHeight(): number {
        return this.padHeight;
    }

    getTransform(): TransformNode {
        return this.deck;
    }

    getBoundingRadius(): number {
        return this.boundingRadius;
    }

    getLights(): Array<Light> {
        return this.spotLights.map((entry) => entry.light);
    }

    setLightsColor({ r, g, b }: RGBColor): void {
        for (const spotLight of this.spotLights) {
            spotLight.color.copyFromFloats(r, g, b);
        }
    }

    dispose() {
        this.deck.dispose();
        this.deckAggregate?.dispose();
        this.deckMaterial.dispose();
    }

    getTypeName(): string {
        return i18n.t("objectTypes:landingPad");
    }
}
