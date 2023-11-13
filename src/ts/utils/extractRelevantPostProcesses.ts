import { Engine } from "@babylonjs/core/Engines/engine";
import { ObjectPostProcess } from "../view/postProcesses/objectPostProcess";
import { PostProcessRenderEffect } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderEffect";
import { AbstractObject } from "../view/bodies/abstractObject";

export function extractRelevantPostProcesses(postProcesses: ObjectPostProcess[], body: AbstractObject): [ObjectPostProcess[], ObjectPostProcess[]] {
    const relevant = [];
    const notRelevant = [];
    for (const postProcess of postProcesses) {
        if (postProcess.object === body) relevant.push(postProcess);
        else notRelevant.push(postProcess);
    }
    return [relevant, notRelevant];
}

export function makeSplitRenderEffects(name: string, body: AbstractObject, postProcesses: ObjectPostProcess[], engine: Engine): [PostProcessRenderEffect, PostProcessRenderEffect] {
    const [bodyRings, otherRings] = extractRelevantPostProcesses(postProcesses, body);
    const otherRingsRenderEffect = new PostProcessRenderEffect(engine, `other${name}RenderEffect`, () => {
        return otherRings;
    });
    const bodyRingsRenderEffect = new PostProcessRenderEffect(engine, `body${name}RenderEffect`, () => {
        return bodyRings;
    });

    return [otherRingsRenderEffect, bodyRingsRenderEffect];
}
