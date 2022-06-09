import { AbstractBody } from "../abstractBody";
import { Seedable } from "../interfaces";
import { AtmosphericScatteringPostProcess } from "../../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { Star } from "../stars/star";
import { Scene, Vector3 } from "@babylonjs/core";
import { FlatCloudsPostProcess } from "../../postProcesses/planetPostProcesses/flatCloudsPostProcess";
import { PlayerController } from "../../player/playerController";
import { OceanPostProcess } from "../../postProcesses/planetPostProcesses/oceanPostProcess";
import { StarSystemManager } from "../starSystemManager";
import { IPlanetPhysicalProperties } from "../iPhysicalProperties";
import { PlanetPostProcesses } from "../postProcessesInterfaces";
import { unpackSeedToVector3 } from "../../utils/random";

export abstract class AbstractPlanet extends AbstractBody implements Seedable {
    readonly _radius: number;
    protected readonly _seed: number;
    abstract override physicalProperties: IPlanetPhysicalProperties;
    public override postProcesses: PlanetPostProcesses;

    protected constructor(name: string, radius: number, starSystemManager: StarSystemManager, seed = 0) {
        super(name, starSystemManager);
        this._radius = radius;
        this._seed = seed;
        this.postProcesses = {
            atmosphere: null,
            ocean: null,
            clouds: null,
            rings: null
        };
    }

    public getSeed(): number {
        return this._seed;
    }

    public getSeed3(): Vector3 {
        return Vector3.FromArray(unpackSeedToVector3(this.getSeed()));
    }

    public override getRadius(): number {
        return this._radius;
    }

    public createAtmosphere(atmosphereHeight: number, star: Star, scene: Scene): AtmosphericScatteringPostProcess {
        let atmosphere = new AtmosphericScatteringPostProcess(`${this.getName()}Atmosphere`, this, atmosphereHeight, star, scene);
        atmosphere.settings.intensity = 12 * this.physicalProperties.pressure;
        this.postProcesses.atmosphere = atmosphere;
        return atmosphere;
    }

    public createClouds(cloudLayerHeight: number, star: Star, scene: Scene): FlatCloudsPostProcess {
        let clouds = new FlatCloudsPostProcess(`${this.getName()}Clouds`, this, cloudLayerHeight, star, scene);
        this.postProcesses.clouds = clouds;
        return clouds;
    }

    public createOcean(star: Star, scene: Scene): OceanPostProcess {
        let ocean = new OceanPostProcess(`${this.getName()}Ocean`, this, star, scene);
        this.postProcesses.ocean = ocean;
        return ocean;
    }

    public override update(player: PlayerController, lightPosition: Vector3, deltaTime: number) {
        super.update(player, lightPosition, deltaTime);
        for (const postprocessKey in this.postProcesses) {
            if (this.postProcesses[postprocessKey] != null) {
                this.postProcesses[postprocessKey]!.update(deltaTime);
            }
        }
    }
}
