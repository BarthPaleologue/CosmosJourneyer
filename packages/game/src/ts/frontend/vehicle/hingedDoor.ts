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

import {
    PhysicsConstraintMotorType,
    type PhysicsConstraintAxis,
} from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import type { Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import type { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";

import i18n from "@/i18n";

import type { Interaction } from "../inputs/interaction/interactionSystem";
import type { Door, DoorState } from "./door";

export class HingedDoor implements Door {
    readonly doorAggregate: PhysicsAggregate;
    readonly hinge: Physics6DoFConstraint;
    readonly axis: PhysicsConstraintAxis;

    private state: DoorState = "closed";

    private readonly closedAngle: number;
    private readonly openedAngle: number;

    constructor(
        doorAggregate: PhysicsAggregate,
        hinge: Physics6DoFConstraint,
        axis: PhysicsConstraintAxis,
        angles: { closed: number; opened: number },
    ) {
        this.doorAggregate = doorAggregate;
        this.axis = axis;

        this.hinge = hinge;
        this.hinge.setAxisMotorType(this.axis, PhysicsConstraintMotorType.POSITION);
        this.hinge.setAxisMotorMaxForce(this.axis, 5_000);

        this.closedAngle = angles.closed;
        this.openedAngle = angles.opened;

        this.close();
    }

    open() {
        this.hinge.setAxisMotorTarget(this.axis, this.openedAngle);
        this.state = "opened";
    }

    close() {
        this.hinge.setAxisMotorTarget(this.axis, this.closedAngle);
        this.state = "closed";
    }

    getState(): DoorState {
        return this.state;
    }

    getPhysicsAggregate(): { body: PhysicsBody; shape: PhysicsShape } {
        return this.doorAggregate;
    }

    getInteractions(): Array<Interaction> {
        switch (this.state) {
            case "opened":
                return [
                    {
                        label: i18n.t("interactions:close"),
                        perform: () => {
                            this.close();
                            return Promise.resolve();
                        },
                    },
                ];
            case "closed":
                return [
                    {
                        label: i18n.t("interactions:open"),
                        perform: () => {
                            this.open();
                            return Promise.resolve();
                        },
                    },
                ];
        }
    }

    dispose() {
        this.doorAggregate.dispose();
        this.hinge.dispose();
    }
}
