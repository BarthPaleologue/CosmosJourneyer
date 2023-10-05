import { AbstractBody } from "../abstractBody";

import { UberScene } from "../../../controller/uberCore/uberScene";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Star } from "./star";
import { NeutronStarDescriptor } from "../../../model/stellarObjects/neutronStarDescriptor";

export class NeutronStar extends Star {
    readonly descriptor: NeutronStarDescriptor;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param seed The seed of the star in [-1, 1]
     * @param parentBodies The bodies the star is orbiting
     */
    constructor(name: string, scene: UberScene, seed: number, parentBody?: AbstractBody) {
        super(name, scene, seed, parentBody);

        this.descriptor = new NeutronStarDescriptor(
            seed,
            parentBody?.model
        );

        this.postProcesses.push(PostProcessType.MATTER_JETS);
    }
}
