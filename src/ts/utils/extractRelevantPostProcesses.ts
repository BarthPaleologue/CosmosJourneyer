//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { ObjectPostProcess } from "../postProcesses/objectPostProcess";
import { PostProcessRenderEffect } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderEffect";
import { CelestialBody } from "../architecture/celestialBody";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

export function extractRelevantPostProcesses(postProcesses: ObjectPostProcess[], body: CelestialBody): [ObjectPostProcess[], ObjectPostProcess[]] {
    const relevant = [];
    const notRelevant = [];
    for (const postProcess of postProcesses) {
        if (postProcess.object === body) relevant.push(postProcess);
        else notRelevant.push(postProcess);
    }
    return [relevant, notRelevant];
}

export function makeSplitRenderEffects(
    name: string,
    body: CelestialBody,
    postProcesses: ObjectPostProcess[],
    engine: AbstractEngine
): [PostProcessRenderEffect, PostProcessRenderEffect] {
    const [bodyRings, otherRings] = extractRelevantPostProcesses(postProcesses, body);
    const otherRingsRenderEffect = new PostProcessRenderEffect(engine, `other${name}RenderEffect`, () => {
        return otherRings;
    });
    const bodyRingsRenderEffect = new PostProcessRenderEffect(engine, `body${name}RenderEffect`, () => {
        return bodyRings;
    });

    return [otherRingsRenderEffect, bodyRingsRenderEffect];
}
