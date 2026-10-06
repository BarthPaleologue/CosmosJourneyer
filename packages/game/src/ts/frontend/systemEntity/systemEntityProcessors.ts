//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { Target } from "../targeting/target";
import type { AnySystemContentType, SystemEntity } from "./systemEntity";
import { SystemEntityProcessorRegistry } from "./systemEntityProcessor";
import type { SystemEntityProcessor } from "./systemEntityProcessor";

export type SystemEntityUpdateContext = {
    observerPosition: Vector3;
    deltaSeconds: number;
};

export class SystemEntityProcessors {
    readonly targeting: SystemEntityProcessorRegistry<void, Array<Target>>;
    private readonly update: SystemEntityProcessorRegistry<SystemEntityUpdateContext, void>;

    constructor() {
        this.targeting = new SystemEntityProcessorRegistry(() => []);
        this.update = new SystemEntityProcessorRegistry(() => {});
    }

    registerUpdate<T extends AnySystemContentType>(
        type: T,
        update: SystemEntityProcessor<T, SystemEntityUpdateContext, void>,
    ) {
        this.update.register(type, update);
    }

    updateEntities(entities: Iterable<SystemEntity>, context: SystemEntityUpdateContext) {
        for (const entity of entities) {
            this.update.dispatch(entity, context);
        }
    }

    dispose() {
        this.targeting.dispose();
        this.update.dispose();
    }
}
