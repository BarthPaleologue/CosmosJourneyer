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
import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import ReleaseInteraction from "@brianchirls/game-input/interactions/ReleaseInteraction";

import type { NonEmptyArray } from "@/utils/types";

import { InputDevices } from "../devices";

export type Interaction = {
    label: string;
    perform: () => void;
};

export class InteractionSystem {
    private readonly scene: Scene;

    private readonly physicsEngine: PhysicsEngineV2;

    private readonly mask: number;

    private readonly raycastResult = new PhysicsRaycastResult();

    private currentTarget: PhysicsBody | null = null;

    private interactions: Map<PhysicsBody, () => NonEmptyArray<Interaction>> = new Map();

    readonly onTargetChanged = new Observable<NonEmptyArray<Interaction> | null>();

    readonly onChoiceStarted = new Observable<void>();

    readonly onChoiceEnded = new Observable<void>();

    private longPressTimer: number | null = null;

    private longPressThreshold = 0.3;

    private shouldCancelShortPress = false;

    private readonly choiceHandler: (interactions: NonEmptyArray<Interaction>) => Promise<Interaction | null>;

    constructor(
        mask: number,
        scene: Scene,
        choiceHandler: (interactions: NonEmptyArray<Interaction>) => Promise<Interaction | null>,
    ) {
        this.scene = scene;
        this.physicsEngine = scene.getPhysicsEngine() as PhysicsEngineV2;
        this.mask = mask;
        this.choiceHandler = choiceHandler;

        const interactAction = new Action({
            bindings: [InputDevices.KEYBOARD.getControl("KeyE")],
        });

        const interactPressInteraction = new PressInteraction(interactAction);
        const interactReleaseInteraction = new ReleaseInteraction(interactAction);

        interactPressInteraction.on("start", () => {
            this.longPressTimer = 0;
        });

        interactReleaseInteraction.on("complete", () => {
            if (this.shouldCancelShortPress) {
                this.shouldCancelShortPress = false;
                return;
            }

            this.longPressTimer = null;

            this.performShortAction();
        });
    }

    private performShortAction() {
        if (this.currentTarget === null) {
            return;
        }

        const interactionGetter = this.interactions.get(this.currentTarget);
        if (interactionGetter === undefined) {
            return;
        }

        const interactions = interactionGetter();
        interactions[0].perform();
    }

    private async performLongAction() {
        if (this.currentTarget === null) {
            return;
        }

        const interactionGetter = this.interactions.get(this.currentTarget);
        if (interactionGetter === undefined) {
            return;
        }

        const interactions = interactionGetter();
        this.onChoiceStarted.notifyObservers();
        const chosenInteraction = await this.choiceHandler(interactions);
        this.onChoiceEnded.notifyObservers();
        chosenInteraction?.perform();
    }

    register(
        object: { body: PhysicsBody; shape: PhysicsShape },
        interactionGetter: () => NonEmptyArray<Interaction>,
    ): void {
        object.shape.filterMembershipMask |= this.mask;

        this.interactions.set(object.body, interactionGetter);

        object.body.transformNode.onDisposeObservable.addOnce(() => {
            this.interactions.delete(object.body);
        });
    }

    public getCurrentTarget(): PhysicsBody | null {
        return this.currentTarget;
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
            transform.overlayAlpha = 0.2;
            transform.enableEdgesRendering();
            transform.edgesColor.set(0.5, 0.5, 1, 1);
        }
    }

    update(deltaSeconds: number) {
        if (this.longPressTimer !== null) {
            this.longPressTimer += deltaSeconds;
            if (this.longPressTimer >= this.longPressThreshold) {
                this.shouldCancelShortPress = true;
                this.longPressTimer = null;

                void this.performLongAction();
            }
        }

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
