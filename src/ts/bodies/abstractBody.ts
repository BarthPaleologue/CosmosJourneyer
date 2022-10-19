import { Quaternion, Axis, Vector3 } from "@babylonjs/core";
import { BodyType, ISeedable } from "./interfaces";
import { AbstractController } from "../controllers/abstractController";
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

enum Steps {
    AXIAL_TILT = 100,
    ORBIT = 200,
    RINGS = 300
}

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

    /**
     * An abstract representation of a celestial body
     * @param name the name of the celestial body
     * @param starSystemManager the star system manager that this body belongs to
     * @param seed the seed for the random number generator in [-1, 1]
     * @param parentBodies the parent bodies of this body
     */
    protected constructor(name: string, starSystemManager: StarSystem, seed: number, parentBodies: IOrbitalBody[]) {
        super(name);
        this.name = name;

        console.assert(-1 <= seed && seed <= 1, "seed must be in [-1, 1]");
        this.seed = seed;

        this.rng = seededSquirrelNoise(seed * Number.MAX_SAFE_INTEGER);

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

        this.rotate(Axis.X, normalRandom(0, 0.2, this.rng, Steps.AXIAL_TILT));
        this.rotate(Axis.Z, normalRandom(0, 0.2, this.rng, Steps.AXIAL_TILT + 10));

        // TODO: do not hardcode
        const periapsis = this.rng(Steps.ORBIT) * 5000000e3;
        const apoapsis = periapsis * (1 + this.rng(Steps.ORBIT + 10) / 10);

        this.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, this.parentBodies),
            orientationQuaternion: Quaternion.Identity()
        };
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

    /**
     * Returns the axis of rotation of the body
     */
    public getRotationAxis(): Vector3 {
        return this.node.up;
    }

    public createRings(): RingsPostProcess {
        const rings = new RingsPostProcess(`${this.name}Rings`, this, this.starSystem.scene, this.starSystem);
        rings.settings.ringStart = randRange(1.8, 2.2, this.rng, Steps.RINGS);
        rings.settings.ringEnd = randRange(2.1, 2.9, this.rng, Steps.RINGS + 10);
        rings.settings.ringOpacity = this.rng(Steps.RINGS + 20);
        this.postProcesses.rings = rings;
        return rings;
    }

    /**
     * Updates the state of the celestial body for a given time step of deltaTime
     * @param player the player in the simulation
     * @param deltaTime the time step to update for
     */
    public updateTransform(player: AbstractController, deltaTime: number): void {
        if (this.orbitalProperties.period > 0) {
            const [barycenter, orientationQuaternion] = computeBarycenter(this, this.parentBodies);
            this.orbitalProperties.orientationQuaternion = orientationQuaternion;

            //TODO: orient the planet accurately

            const initialPosition = this.getAbsolutePosition().clone();
            const newPosition = computePointOnOrbit(barycenter, this.orbitalProperties, this.starSystem.getTime());

            if (player.isOrbiting(this, 50 / (this.depth + 1) ** 3)) player.transform.translate(newPosition.subtract(initialPosition));
            this.starSystem.translateAllBodies(player.transform.getAbsolutePosition().negate());
            player.transform.translate(player.transform.getAbsolutePosition().negate());
            this.translate(newPosition.subtract(initialPosition));
        }

        if (this.physicalProperties.rotationPeriod > 0) {
            const dtheta = (2 * Math.PI * deltaTime) / this.physicalProperties.rotationPeriod;

            if (player.isOrbiting(this)) player.transform.rotateAround(this.getAbsolutePosition(), this.node.up, -dtheta);
            this.starSystem.translateAllBodies(player.transform.getAbsolutePosition().negate());
            player.transform.translate(player.transform.getAbsolutePosition().negate());
            this.rotate(this.getRotationAxis(), -dtheta);
        }
    }

    public updateGraphics(controller: AbstractController, deltaTime: number): void {
        for (const postprocessKey in this.postProcesses) {
            const postProcess = this.postProcesses[postprocessKey];
            if (postProcess == null) continue;
            postProcess.update(deltaTime);
        }
    }
}
