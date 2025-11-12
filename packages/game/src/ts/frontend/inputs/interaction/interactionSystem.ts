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

import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import type { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import type { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene";

type Interaction = {
    label: string;
    perform: () => void;
};

export class InteractionSystem {
    private readonly scene: Scene;

    private readonly physicsEngine: PhysicsEngineV2;

    private readonly mask: number;

    private readonly raycastResult = new PhysicsRaycastResult();

    private currentTarget: PhysicsBody | null = null;

    private interactions: Map<PhysicsBody, () => Array<Interaction>> = new Map();

    readonly onTargetChanged = new Observable<Array<Interaction> | null>();

    constructor(mask: number, scene: Scene) {
        this.scene = scene;
        this.physicsEngine = scene.getPhysicsEngine() as PhysicsEngineV2;
        this.mask = mask;

        document.addEventListener("keydown", (e) => {
            if (e.key !== "e" && e.key !== "E") {
                return;
            }

            if (this.currentTarget === null) {
                return;
            }

            const interactionGetter = this.interactions.get(this.currentTarget);
            if (interactionGetter === undefined) {
                return;
            }

            interactionGetter().forEach((interaction) => {
                interaction.perform();
            });
        });
    }

    register(object: { body: PhysicsBody; shape: PhysicsShape }, interactionGetter: () => Array<Interaction>): void {
        object.shape.filterMembershipMask |= this.mask;

        this.interactions.set(object.body, interactionGetter);

        object.body.transformNode.onDisposeObservable.addOnce(() => {
            this.interactions.delete(object.body);
        });
    }

    private setCurrentTarget(target: PhysicsBody | null) {
        if (this.currentTarget === target) {
            return;
        }

        const interactionGetter = target === null ? null : (this.interactions.get(target) ?? null);
        const interactions = interactionGetter === null ? null : interactionGetter();
        this.onTargetChanged.notifyObservers(interactions);

        if (this.currentTarget !== null) {
            const transform = this.currentTarget.transformNode;
            if (transform instanceof AbstractMesh) {
                transform.renderOverlay = false;
                transform.disableEdgesRendering();
            }
        }

        this.currentTarget = target;

        const transform = target?.transformNode;
        if (transform instanceof AbstractMesh) {
            transform.renderOverlay = true;
            transform.overlayColor.set(0.5, 0.5, 1);
            transform.enableEdgesRendering();
            transform.edgesColor.set(0.5, 0.5, 1, 1);
        }
    }

    update() {
        const activeCamera = this.scene.activeCamera;
        if (activeCamera === null) {
            console.warn("No active camera in scene");
            return;
        }

        const rayLength = 5;
        const cameraRay = activeCamera.getForwardRay(
            rayLength,
            activeCamera.getWorldMatrix(),
            activeCamera.getWorldMatrix().getTranslation(),
        );

        const start = cameraRay.origin;
        const end = start.add(cameraRay.direction.scale(rayLength));
        this.physicsEngine.raycastToRef(start, end, this.raycastResult, {
            collideWith: this.mask,
        });

        const physicsBody = this.raycastResult.body;
        if (physicsBody === undefined) {
            this.setCurrentTarget(null);
            return;
        }

        this.setCurrentTarget(physicsBody);
    }
}
