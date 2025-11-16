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

import { PhysicsViewer } from "@babylonjs/core";
import { PhysicsConstraintAxis } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import type { Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import type { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";

import { CollisionMask } from "@/settings";

import type { Interaction, Interactive } from "../inputs/interaction/interactionSystem";

type DoorState = "opening" | "closing" | "opened" | "closed";

export class HingedDoor implements Interactive {
    readonly doorAggregate: PhysicsAggregate;
    readonly hingeAggregate: PhysicsAggregate;

    readonly hinge: Physics6DoFConstraint;

    private state: DoorState = "closed";

    constructor(doorAggregate: PhysicsAggregate, hingeAggregate: PhysicsAggregate, hinge: Physics6DoFConstraint) {
        this.doorAggregate = doorAggregate;
        this.doorAggregate.shape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;
        this.doorAggregate.shape.filterCollideMask = CollisionMask.EVERYTHING;

        this.hingeAggregate = hingeAggregate;
        this.hingeAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        this.hingeAggregate.shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.ENVIRONMENT;

        this.hinge = hinge;
        this.hinge.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_Y, 1e5);

        const pv = new PhysicsViewer();
        pv.showConstraint(this.hinge);

        this.close();
    }

    open() {
        this.hinge.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_Y, -1.0);
        this.state = "opening";
    }

    close() {
        this.hinge.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_Y, 1.0);
        this.state = "closing";
    }

    getPhysicsAggregate(): { body: PhysicsBody; shape: PhysicsShape } {
        return this.doorAggregate;
    }

    getInteractions(): Array<Interaction> {
        switch (this.state) {
            case "opening":
            case "opened":
                return [
                    {
                        label: "Close",
                        perform: () => {
                            this.close();
                        },
                    },
                ];
            case "closing":
            case "closed":
                return [
                    {
                        label: "Open",
                        perform: () => {
                            this.open();
                        },
                    },
                ];
        }
    }
}
