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

import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { type PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { type HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { type Scene } from "@babylonjs/core/scene";

import { CollisionMask } from "@/settings";

/**
 *
 * @param body
 * @param enabled
 * @param havokPlugin
 * @see https://forum.babylonjs.com/t/havok-setenabled-on-body-shape/40818
 */
export function setEnabledBody(body: PhysicsBody, enabled: boolean, havokPlugin: HavokPlugin): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (enabled) havokPlugin._hknp.HP_World_AddBody(havokPlugin.world, body._pluginData.hpBodyId, body.startAsleep);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    else havokPlugin._hknp.HP_World_RemoveBody(havokPlugin.world, body._pluginData.hpBodyId);
}

export function createEnvironmentAggregate(
    mesh: AbstractMesh,
    physicsShapeType: PhysicsShapeType,
    scene: Scene,
): PhysicsAggregate {
    const aggregate = new PhysicsAggregate(mesh, physicsShapeType, { mass: 0 }, scene);
    aggregate.body.disablePreStep = false;
    aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

    return aggregate;
}
