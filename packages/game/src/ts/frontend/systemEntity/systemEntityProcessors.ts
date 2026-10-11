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
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import type { Musics } from "../assets/audio/musics";
import type { SystemEntityMusicContext } from "../audio/musicSystem";
import type { ClusteredLightingRegion } from "../helpers/clusteredLightingSystem";
import type { Target } from "../targeting/target";
import type { HasBoundingSphere } from "../universe/architecture/hasBoundingSphere";
import type { Transformable } from "../universe/architecture/transformable";
import type { LandingPadProvider } from "../universe/orbitalFacility/landingPadProvider";
import type { AnySystemContentType, SystemEntity } from "./systemEntity";
import { SystemEntityProcessorRegistry } from "./systemEntityProcessor";
import type { SystemEntityProcessor } from "./systemEntityProcessor";

export type SystemEntityUpdateContext = {
    observerPosition: Vector3;
    deltaSeconds: number;
};

export class SystemEntityProcessors {
    readonly targeting: SystemEntityProcessorRegistry<void, Array<Target>>;
    readonly music: SystemEntityProcessorRegistry<SystemEntityMusicContext, Array<keyof Musics>>;
    private readonly update: SystemEntityProcessorRegistry<SystemEntityUpdateContext, void>;
    readonly shadowCasters: SystemEntityProcessorRegistry<void, Array<TransformNode>>;
    readonly sphereOccluders: SystemEntityProcessorRegistry<void, Array<Transformable & HasBoundingSphere>>;
    readonly landingPadManagers: SystemEntityProcessorRegistry<void, LandingPadProvider | null>;
    readonly lightingRegions: SystemEntityProcessorRegistry<void, ClusteredLightingRegion | null>;

    constructor() {
        this.targeting = new SystemEntityProcessorRegistry(() => []);
        this.music = new SystemEntityProcessorRegistry(() => []);
        this.update = new SystemEntityProcessorRegistry(() => {});
        this.shadowCasters = new SystemEntityProcessorRegistry(() => []);
        this.sphereOccluders = new SystemEntityProcessorRegistry(() => []);
        this.landingPadManagers = new SystemEntityProcessorRegistry(() => null);
        this.lightingRegions = new SystemEntityProcessorRegistry(() => null);
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
        this.music.dispose();
        this.update.dispose();
        this.shadowCasters.dispose();
        this.sphereOccluders.dispose();
        this.landingPadManagers.dispose();
        this.lightingRegions.dispose();
    }
}
