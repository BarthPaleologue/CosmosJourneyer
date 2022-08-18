import { Quaternion, Axis } from "@babylonjs/core";
import { BodyType, ISeedable } from "./interfaces";
import { PlayerController } from "../player/playerController";
import { StarSystem } from "./starSystem";
import { PhysicalProperties } from "./physicalProperties";
import { BodyPostProcesses } from "./postProcessesInterfaces";
import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { computeBarycenter, computePointOnOrbit, getOrbitalPeriod } from "../orbits/kepler";
import { RingsPostProcess } from "../postProcesses/planetPostProcesses/ringsPostProcess";
import { IOrbitalBody } from "../orbits/iOrbitalBody";
import { normalRandom, randRange } from "extended-random";
import { BasicTransform } from "../core/transforms/basicTransform";
import { seededSquirrelNoise } from "squirrel-noise";

export abstract class AbstractBody extends BasicTransform implements IOrbitalBody, ISeedable {
    abstract readonly bodyType: BodyType;

    abstract physicalProperties: PhysicalProperties;
    orbitalProperties: IOrbitalProperties;
    abstract postProcesses: BodyPostProcesses;

    readonly starSystem: StarSystem;

    readonly name: string;

    readonly seed: number;

    readonly rng: (step: number) => number;

    abstract readonly radius: number;

    readonly parentBodies: IOrbitalBody[];
    readonly childrenBodies: IOrbitalBody[] = [];

    depth: number;

    protected constructor(name: string, starSystemManager: StarSystem, seed: number, parentBodies: IOrbitalBody[]) {
        super(name);
        this.name = name;
        this.seed = seed;

        this.rng = seededSquirrelNoise(seed);

        this.starSystem = starSystemManager;
        starSystemManager.addBody(this);

        this.parentBodies = parentBodies;

        let minDepth = -1;
        for (const parentBody of parentBodies) {
            if (minDepth == -1) minDepth = parentBody.depth;
            else minDepth = Math.min(minDepth, parentBody.depth);
        }
        if (minDepth == -1) this.depth = 0;
        else this.depth = minDepth + 1;

        this.rotate(Axis.X, normalRandom(0, 0.2, this.getRNG(), 0));
        this.rotate(Axis.Z, normalRandom(0, 0.2, this.getRNG(), 2));

        // TODO: do not hardcode
        const periapsis = this.rng(10) * 5000000e3;
        const apoapsis = periapsis * (1 + this.rng(11) / 10);

        this.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, this.parentBodies),
            orientationQuaternion: Quaternion.Identity()
        };
    }

    public getRNG(): (step?: number) => number {
        return this.rng as (step?: number) => number;
    }

    /**
     * Returns the radius of the celestial body
     */
    public getRadius(): number {
        return this.radius;
    }

    /**
     * Returns apparent radius of the celestial body (can be greater than the actual radius for example : ocean)
     */
    public getApparentRadius(): number {
        return this.getRadius();
    }

    /**
     * Returns the diameter of the celestial body
     */
    public getDiameter(): number {
        return 2 * this.getRadius();
    }

    public createRings(): RingsPostProcess {
        const rings = new RingsPostProcess(`${this.name}Rings`, this, this.starSystem.scene);
        rings.settings.ringStart = randRange(1.8, 2.2, this.getRNG(), 20);
        rings.settings.ringEnd = randRange(2.1, 2.9, this.getRNG(), 21);
        rings.settings.ringOpacity = this.rng(22);
        this.postProcesses.rings = rings;
        return rings;
    }

    /**
     * Updates the state of the celestial body for a given time step of deltaTime
     * @param player the player in the simulation
     * @param deltaTime the time step to update for
     */
    public update(player: PlayerController, deltaTime: number): void {
        if (this.orbitalProperties.period > 0) {
            const [barycenter, orientationQuaternion] = computeBarycenter(this, this.parentBodies);
            this.orbitalProperties.orientationQuaternion = orientationQuaternion;

            //TODO: orient the planet accurately

            const initialPosition = this.getAbsolutePosition().clone();
            const newPosition = computePointOnOrbit(barycenter, this.orbitalProperties, this.starSystem.getTime());

            if (player.isOrbiting(this, 50 / (this.depth + 1) ** 3)) player.translate(newPosition.subtract(initialPosition));
            this.setAbsolutePosition(newPosition);
        }

        if (this.physicalProperties.rotationPeriod > 0) {
            const dtheta = (2 * Math.PI * deltaTime) / this.physicalProperties.rotationPeriod;

            if (player.isOrbiting(this)) player.rotateAround(this.getAbsolutePosition(), this.transform.up, -dtheta);
            this.rotate(this.transform.up, -dtheta);
        }

        for (const postprocessKey in this.postProcesses) {
            const postProcess = this.postProcesses[postprocessKey];
            if (postProcess == null) continue;
            postProcess.update(deltaTime);
        }
    }
}
