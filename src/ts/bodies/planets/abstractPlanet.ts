import { AbstractBody } from "../abstractBody";
import { AtmosphericScatteringPostProcess } from "../../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { Star } from "../stars/star";
import { Scene, Vector3 } from "@babylonjs/core";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { IPlanetPhysicalProperties } from "../iPhysicalProperties";
import { PlanetPostProcesses } from "../postProcessesInterfaces";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { centeredRand } from "extended-random";

export abstract class AbstractPlanet extends AbstractBody {
    abstract override physicalProperties: IPlanetPhysicalProperties;
    public override postProcesses: PlanetPostProcesses;

    protected constructor(name: string, starSystemManager: StarSystemManager, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, starSystemManager, seed, parentBodies);
        this.postProcesses = {
            atmosphere: null,
            ocean: null,
            clouds: null,
            rings: null
        };
    }

    public createAtmosphere(atmosphereHeight: number, star: Star, scene: Scene): AtmosphericScatteringPostProcess {
        const atmosphere = new AtmosphericScatteringPostProcess(`${this.name}Atmosphere`, this, atmosphereHeight, this.starSystem);
        atmosphere.settings.intensity = 12 * this.physicalProperties.pressure;
        atmosphere.settings.redWaveLength *= 1 + centeredRand(this.rng) / 6;
        atmosphere.settings.greenWaveLength *= 1 + centeredRand(this.rng) / 6;
        atmosphere.settings.blueWaveLength *= 1 + centeredRand(this.rng) / 6;
        this.postProcesses.atmosphere = atmosphere;
        return atmosphere;
    }

    public override update(player: PlayerController, deltaTime: number): void {
        super.update(player, deltaTime);
        for (const postprocessKey in this.postProcesses) {
            if (this.postProcesses[postprocessKey] != null) {
                this.postProcesses[postprocessKey]!.update(deltaTime);
            }
        }
    }
}
