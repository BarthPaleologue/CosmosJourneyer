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

import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Ray } from "@babylonjs/core/Culling/ray.core";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import type { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import type { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene";
import Action from "@brianchirls/game-input/Action";
import PressInteraction from "@brianchirls/game-input/interactions/PressInteraction";
import ReleaseInteraction from "@brianchirls/game-input/interactions/ReleaseInteraction";

import { InputDevices } from "../devices";

export type Interaction = {
    label: string;
    perform: () => Promise<void>;
};

export interface Interactive {
    getPhysicsAggregate(): { body: PhysicsBody; shape: PhysicsShape };
    getInteractions(): Array<Interaction>;
}

export class InteractionSystem {
    readonly scene: Scene;

    private readonly physicsEngine: PhysicsEngineV2;

    private readonly mask: number;

    private readonly raycastResult = new PhysicsRaycastResult();

    private currentTarget: PhysicsBody | null = null;

    private interactions: Map<PhysicsBody, () => Array<Interaction>> = new Map();

    private longPressTimer: number | null = null;

    private longPressThreshold = 0.3;

    private shouldCancelShortPress = false;

    private readonly choiceHandler: (interactions: Array<Interaction>) => Promise<Interaction | null>;

    readonly pressInteraction: PressInteraction;

    readonly releaseInteraction: ReleaseInteraction;

    private isMakingChoiceFlag = false;

    private readonly cameras: Array<Camera>;

    constructor(
        mask: number,
        scene: Scene,
        cameras: ReadonlyArray<Camera>,
        choiceHandler: (interactions: Array<Interaction>) => Promise<Interaction | null>,
    ) {
        this.scene = scene;
        this.physicsEngine = scene.getPhysicsEngine() as PhysicsEngineV2;
        this.mask = mask;
        this.choiceHandler = choiceHandler;

        this.cameras = [...cameras];

        const interactAction = new Action({
            bindings: [InputDevices.KEYBOARD.getControl("KeyE")],
        });

        this.pressInteraction = new PressInteraction(interactAction);
        this.releaseInteraction = new ReleaseInteraction(interactAction);

        this.pressInteraction.on("start", () => {
            this.longPressTimer = 0;
        });

        this.releaseInteraction.on("complete", async () => {
            if (this.shouldCancelShortPress) {
                this.shouldCancelShortPress = false;
                return;
            }

            this.longPressTimer = null;

            await this.performFirstAction();
        });
    }

    public isEnabledForCamera(camera: Camera): boolean {
        return this.cameras.includes(camera);
    }

    private async performFirstAction() {
        const interactions = this.getCurrentInteractions();
        if (interactions === null || interactions[0] === undefined) {
            return;
        }

        await interactions[0].perform();
    }

    private async chooseAction() {
        const interactions = this.getCurrentInteractions();
        if (interactions === null || interactions.length < 2) {
            return;
        }

        this.isMakingChoiceFlag = true;
        const chosenInteraction = await this.choiceHandler(interactions);
        this.isMakingChoiceFlag = false;

        await chosenInteraction?.perform();
    }

    public isMakingChoice(): boolean {
        return this.isMakingChoiceFlag;
    }

    public register(interactiveObject: Interactive): void {
        const { body, shape } = interactiveObject.getPhysicsAggregate();
        shape.filterMembershipMask |= this.mask;

        this.interactions.set(body, () => interactiveObject.getInteractions());

        body.transformNode.onDisposeObservable.addOnce(() => {
            this.interactions.delete(body);
        });
    }

    public getCurrentInteractions(): Array<Interaction> | null {
        if (this.currentTarget === null) {
            return null;
        }

        const interactionGetter = this.interactions.get(this.currentTarget);
        if (interactionGetter === undefined) {
            return null;
        }

        return [...interactionGetter()];
    }

    public getCurrentTarget(): PhysicsBody | null {
        return this.currentTarget;
    }

    private updateLongPressTimer(deltaSeconds: number) {
        if (this.longPressTimer === null) {
            return;
        }

        this.longPressTimer += deltaSeconds;
        if (this.longPressTimer < this.longPressThreshold) {
            return;
        }

        this.longPressTimer = null;

        const interactions = this.getCurrentInteractions();
        if (interactions === null || interactions.length < 2) {
            return;
        }

        this.shouldCancelShortPress = true;
        void this.chooseAction();
    }

    private pickWithRay(ray: Ray) {
        const start = ray.origin;
        const end = start.add(ray.direction.scale(ray.length));
        this.physicsEngine.raycastToRef(start, end, this.raycastResult, {
            collideWith: this.mask,
        });

        const physicsBody = this.raycastResult.body;
        if (physicsBody === undefined) {
            this.currentTarget = null;
            return;
        }

        this.currentTarget = physicsBody;
    }

    public update(deltaSeconds: number) {
        const activeCamera = this.scene.activeCamera;
        if (activeCamera === null) {
            console.warn("No active camera in scene");
            return;
        }

        if (!this.isEnabledForCamera(activeCamera)) {
            this.currentTarget = null;
            return;
        }

        this.updateLongPressTimer(deltaSeconds);

        const rayLength = 5;
        const cameraRay = activeCamera.getForwardRay(
            rayLength,
            activeCamera.getWorldMatrix(),
            activeCamera.globalPosition,
        );

        this.pickWithRay(cameraRay);
    }
}
