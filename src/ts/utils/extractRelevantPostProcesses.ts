import { AbstractBody } from "../view/bodies/abstractBody";
import { ObjectPostProcess } from "../view/postProcesses/objectPostProcess";

export function extractRelevantPostProcesses(postProcesses: ObjectPostProcess[], body: AbstractBody): [ObjectPostProcess[], ObjectPostProcess[]] {
    const relevant = [];
    const notRelevant = [];
    for (const postProcess of postProcesses) {
        if (postProcess.object === body) relevant.push(postProcess);
        else notRelevant.push(postProcess);
    }
    return [relevant, notRelevant];
}
