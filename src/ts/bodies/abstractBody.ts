import { Axis, Quaternion, Vector3 } from "@babylonjs/core";
import { BodyType, ISeedable } from "./interfaces";
import { AbstractController } from "../controllers/abstractController";
import { PhysicalProperties } from "./physicalProperties";
import { BodyPostProcesses } from "./postProcessesInterfaces";
import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { computeBarycenter, computePointOnOrbit, getOrbitalPeriod } from "../orbits/kepler";
import { IOrbitalBody } from "../orbits/iOrbitalBody";
import { normalRandom } from "extended-random";
import { BasicTransform } from "../core/transforms/basicTransform";
import { seededSquirrelNoise } from "squirrel-noise";

enum Steps {
    AXIAL_TILT = 100,
    ORBIT = 200,
    RINGS = 300
}

/**
 * If the parameter is unset, returns whereas the player is orbiting a body, if the parameter is set returns if the player orbits the given body
 * @param controller the controller to check
 * @param body the body to check whereas the player is orbiting
 * @param orbitLimitFactor the boundary of the orbit detection (multiplied by planet radius)
 */
export function isOrbiting(controller: AbstractController, body: AbstractBody, orbitLimitFactor = 2.5): boolean {
    return body.getAbsolutePosition().lengthSquared() < (orbitLimitFactor * body.getRadius()) ** 2;
}

export abstract class AbstractBody extends BasicTransform implements IOrbitalBody, ISeedable {
    abstract readonly bodyType: BodyType;

    abstract physicalProperties: PhysicalProperties;
    orbitalProperties: IOrbitalProperties;
    abstract postProcesses: BodyPostProcesses;

    //TODO: make an universal clock ?? or not it could be funny
    private internalTime = 0;

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
    protected constructor(name: string, seed: number, parentBodies: IOrbitalBody[]) {
        super(name);
        this.name = name;

        console.assert(-1 <= seed && seed <= 1, "seed must be in [-1, 1]");
        this.seed = seed;

        this.rng = seededSquirrelNoise(seed * Number.MAX_SAFE_INTEGER);

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

    public getInternalTime(): number {
        return this.internalTime;
    }

    /**
     * Updates the state of the celestial body for a given time step of deltaTime
     * @param player the player in the simulation
     * @param deltaTime the time step to update for
     */
    public updateTransform(player: AbstractController, deltaTime: number): void {
        this.internalTime += deltaTime;
        if (this.orbitalProperties.period > 0) {
            const [barycenter, orientationQuaternion] = computeBarycenter(this, this.parentBodies);
            this.orbitalProperties.orientationQuaternion = orientationQuaternion;

            //TODO: orient the planet accurately

            const initialPosition = this.getAbsolutePosition().clone();
            const newPosition = computePointOnOrbit(barycenter, this.orbitalProperties, this.internalTime);

            if (isOrbiting(player, this, 50 / (this.depth + 1) ** 3)) player.transform.translate(newPosition.subtract(initialPosition));
            this.translate(newPosition.subtract(initialPosition));
        }

        if (this.physicalProperties.rotationPeriod > 0) {
            const dtheta = (2 * Math.PI * deltaTime) / this.physicalProperties.rotationPeriod;

            if (isOrbiting(player, this)) player.transform.rotateAround(this.getAbsolutePosition(), this.node.up, -dtheta);
            this.rotate(this.getRotationAxis(), -dtheta);
        }
    }
}
