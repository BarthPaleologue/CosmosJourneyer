import {CelestialBody} from "../celestialBody";
import {PlanetPhysicalProperties, PlanetPostProcesses, Seedable} from "../interfaces";
import {PlanetPostProcess} from "../../postProcesses/planetPostProcess";
import {
    AtmosphericScatteringPostProcess
} from "../../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import {Star} from "../stars/star";
import {Matrix, Scene, Vector3} from "@babylonjs/core";
import {FlatCloudsPostProcess} from "../../postProcesses/planetPostProcesses/flatCloudsPostProcess";
import {PlayerController} from "../../player/playerController";
import {OceanPostProcess} from "../../postProcesses/planetPostProcesses/oceanPostProcess";
import {RingsPostProcess} from "../../postProcesses/planetPostProcesses/ringsPostProcess";
import {StarSystemManager} from "../starSystemManager";

export abstract class AbstractPlanet extends CelestialBody implements Seedable {
    readonly _radius: number;
    protected _seed: number[];
    abstract override physicalProperties: PlanetPhysicalProperties;
    public override postProcesses: PlanetPostProcesses;

    protected constructor(name: string, radius: number, starSystemManager: StarSystemManager, seed = [0, 0, 0]) {
        super(name, starSystemManager);
        this._radius = radius;
        this._seed = seed;
        this.postProcesses = {
            atmosphere: null,
            ocean: null,
            clouds: null,
            rings: null
        }
    }

    /**
     * Returns the seed of the planet
     */
    public getSeed(): number[] {
        return this._seed;
    }

    public override getRadius(): number {
        return this._radius;
    }

    public createAtmosphere(atmosphereHeight: number, star: Star, scene: Scene): AtmosphericScatteringPostProcess {
        let atmosphere = new AtmosphericScatteringPostProcess(`${this.getName()}Atmosphere`, this, atmosphereHeight, star, scene);
        atmosphere.settings.intensity = 15 * this.physicalProperties.pressure;
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

    public createRings(star: Star, scene: Scene): RingsPostProcess {
        let rings = new RingsPostProcess(`${this.getName()}Rings`, this, star, scene);
        this.postProcesses.rings = rings;
        return rings;
    }

    /**
     * Returns the world matrix of the planet (see babylonjs world matrix for reference)
     */
    public getWorldMatrix(): Matrix {
        throw new Error("Not implemented");
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