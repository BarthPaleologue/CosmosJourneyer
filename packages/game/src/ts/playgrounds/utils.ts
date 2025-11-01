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

import "@babylonjs/core/Physics/physicsEngineComponent";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { type Scene } from "@babylonjs/core/scene";
import HavokPhysics, { type HavokPhysicsWithBindings } from "@babylonjs/havok";

export async function enablePhysics(scene: Scene, gravity = Vector3.Zero(), havokInstance?: HavokPhysicsWithBindings) {
    const havokPlugin = new HavokPlugin(false, havokInstance ?? (await HavokPhysics()));
    scene.enablePhysics(gravity, havokPlugin);

    return havokPlugin;
}
