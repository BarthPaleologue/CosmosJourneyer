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

import { Animation } from "@babylonjs/core/Animations/animation";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import type { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene";

import type { Interaction, Interactive } from "@/frontend/inputs/interaction/interactionSystem";
import type { Transformable } from "@/frontend/universe/architecture/transformable";

export class Button implements Transformable, Interactive {
    readonly mesh: AbstractMesh;
    private readonly aggregate: PhysicsAggregate;

    private isBeingPressed = false;

    private readonly interaction: Interaction;

    constructor(interaction: Interaction, scene: Scene) {
        this.interaction = interaction;

        const buttonThickness = 0.1;
        this.mesh = MeshBuilder.CreateCylinder("button", { diameter: 0.25, height: buttonThickness }, scene);

        const buttonMaterial = new PBRMaterial("buttonMaterial", scene);
        buttonMaterial.albedoColor = new Color3(1, 0, 0);
        buttonMaterial.roughness = 0.5;
        buttonMaterial.metallic = 0;

        this.mesh.material = buttonMaterial;

        this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.CYLINDER, { mass: 0 }, scene);
        this.aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        this.aggregate.body.disablePreStep = false;
    }

    public getTransform(): TransformNode {
        return this.mesh;
    }

    public getPhysicsAggregate(): { body: PhysicsBody; shape: PhysicsShape } {
        return this.aggregate;
    }

    public getInteractions(): Array<Interaction> {
        if (this.isBeingPressed) {
            return [];
        }

        return [
            {
                label: this.interaction.label,
                perform: async () => {
                    this.startPressAnimation();
                    await this.interaction.perform();
                },
            },
        ];
    }

    private startPressAnimation() {
        if (this.isBeingPressed) {
            return;
        }

        this.isBeingPressed = true;

        const buttonRestPositionY = this.getTransform().position.y;
        const buttonPressDepth = 0.05;
        const buttonAnimationFrameRate = 60;
        const buttonHalfAnimationFrames = Math.round(buttonAnimationFrameRate * 0.1);

        const pressedPositionY = buttonRestPositionY - buttonPressDepth;
        Animation.CreateAndStartAnimation(
            "buttonPressDown",
            this.getTransform(),
            "position.y",
            buttonAnimationFrameRate,
            buttonHalfAnimationFrames,
            buttonRestPositionY,
            pressedPositionY,
            Animation.ANIMATIONLOOPMODE_CONSTANT,
            undefined,
            () => {
                Animation.CreateAndStartAnimation(
                    "buttonPressUp",
                    this.getTransform(),
                    "position.y",
                    buttonAnimationFrameRate,
                    buttonHalfAnimationFrames,
                    pressedPositionY,
                    buttonRestPositionY,
                    Animation.ANIMATIONLOOPMODE_CONSTANT,
                    undefined,
                    () => {
                        this.isBeingPressed = false;
                    },
                );
            },
        );
    }
}
