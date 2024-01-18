import { Star } from "../star/star";
import { NeutronStarModel } from "./neutronStarModel";
import { UberScene } from "../../uberCore/uberScene";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { CelestialBody, HasCelestialBodyModel } from "../../architecture/celestialBody";

export class NeutronStar extends Star {
    readonly descriptor: NeutronStarModel;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param model The seed of the star in [-1, 1]
     * @param parentBody
     */
    constructor(name: string, scene: UberScene, model: number | NeutronStarModel, parentBody: CelestialBody & HasCelestialBodyModel | null = null) {
        super(name, scene, model, parentBody);

        this.descriptor = model instanceof NeutronStarModel ? model : new NeutronStarModel(model, parentBody?.model);

        this.postProcesses.push(PostProcessType.MATTER_JETS);
    }

    getTypeName(): string {
        return "Neutron Star";
    }
}
