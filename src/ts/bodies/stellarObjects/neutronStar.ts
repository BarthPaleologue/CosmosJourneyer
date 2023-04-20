import { AbstractBody } from "../abstractBody";

import { UberScene } from "../../uberCore/uberScene";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Star } from "./star";
import { NeutronStarDescriptor } from "../../descriptors/stellarObjects/neutronStarDescriptor";

export class NeutronStar extends Star {
    readonly descriptor: NeutronStarDescriptor;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param seed The seed of the star in [-1, 1]
     * @param parentBodies The bodies the star is orbiting
     */
    constructor(name: string, scene: UberScene, seed: number, parentBodies: AbstractBody[]) {
        super(name, scene, seed, parentBodies);

        this.descriptor = new NeutronStarDescriptor(
            seed,
            parentBodies.map((body) => body.descriptor)
        );

        this.postProcesses.push(PostProcessType.MATTER_JETS);
    }
}
