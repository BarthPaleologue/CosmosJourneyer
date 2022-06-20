import { AbstractBody } from "../abstractBody";
import { AtmosphericScatteringPostProcess } from "../../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { Star } from "../stars/star";
import { Scene, Vector3 } from "@babylonjs/core";
import { FlatCloudsPostProcess } from "../../postProcesses/planetPostProcesses/flatCloudsPostProcess";
import { PlayerController } from "../../player/playerController";
import { OceanPostProcess } from "../../postProcesses/planetPostProcesses/oceanPostProcess";
import { StarSystemManager } from "../starSystemManager";
import { IPlanetPhysicalProperties } from "../iPhysicalProperties";
import { PlanetPostProcesses } from "../postProcessesInterfaces";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";

export abstract class AbstractPlanet extends AbstractBody {
    abstract override physicalProperties: IPlanetPhysicalProperties;
    public override postProcesses: PlanetPostProcesses;

    protected constructor(name: string, radius: number, starSystemManager: StarSystemManager, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, radius, starSystemManager, seed, parentBodies);
        this.postProcesses = {
            atmosphere: null,
            ocean: null,
            clouds: null,
            rings: null
        };
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
