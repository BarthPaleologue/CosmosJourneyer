import { AbstractBody } from "../bodies/abstractBody";
import { BodyPostProcess } from "../postProcesses/bodyPostProcess";

export function extractRelevantPostProcesses(postProcesses: BodyPostProcess[], body: AbstractBody): [BodyPostProcess[], BodyPostProcess[]] {
    const relevant = [];
    const notRelevant = [];
    for (const postProcess of postProcesses) {
        if (postProcess.body === body) relevant.push(postProcess);
        else notRelevant.push(postProcess);
    }
    return [relevant, notRelevant];
}
