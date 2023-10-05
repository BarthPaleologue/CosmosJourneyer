import { AbstractBody } from "../abstractBody";

import { UberScene } from "../../../controller/uberCore/uberScene";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Star } from "./star";
import { NeutronStarModel } from "../../../model/stellarObjects/neutronStarModel";

export class NeutronStar extends Star {
    readonly descriptor: NeutronStarModel;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param model The seed of the star in [-1, 1]
     * @param parentBodies The bodies the star is orbiting
     */
    constructor(name: string, scene: UberScene, model: number | NeutronStarModel, parentBody?: AbstractBody) {
        super(name, scene, model, parentBody);

        this.descriptor = model instanceof NeutronStarModel ? model : new NeutronStarModel(model, parentBody?.model);

        this.postProcesses.push(PostProcessType.MATTER_JETS);
    }
}
