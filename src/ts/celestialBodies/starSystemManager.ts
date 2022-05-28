import { Vector3, DepthRenderer } from "@babylonjs/core";

import { ChunkForge } from "../chunks/chunkForge";
import { PlayerController } from "../player/playerController";
import { SolidPlanet } from "./planets/solidPlanet";
import { CelestialBody } from "./celestialBody";
import { Star } from "./stars/star";

export class StarSystemManager {
    private readonly _chunkForge: ChunkForge;
    private readonly _celestialBodies: CelestialBody[] = [];

    private clock: number = 0;

    constructor(nbVertices = 64) {
        this._chunkForge = new ChunkForge(nbVertices);
    }

    public addBody(body: CelestialBody) {
        this._celestialBodies.push(body);
    }

    public translateAllCelestialBody(deplacement: Vector3): void {
        for (const planet of this._celestialBodies) {
            planet.setAbsolutePosition(planet.getAbsolutePosition().add(deplacement));
        }
    }

    public rotateAllAround(pivot: Vector3, axis: Vector3, amount: number) {
        for (const planet of this._celestialBodies) {
            planet.rotateAround(pivot, axis, amount);
        }
    }

    public getChunkForge(): ChunkForge {
        return this._chunkForge;
    }

    /**
     * Returns the list of all celestial bodies managed by the star system manager
     */
    public getBodies(): CelestialBody[] {
        return this._celestialBodies;
    }

    /**
     * Returns the nearest body to the origin
     */
    public getNearestBody(): CelestialBody {
        if (this.getBodies().length == 0) throw new Error("There are no bodies in the solar system");
        let nearest = null;
        for (const body of this.getBodies()) {
            if (nearest == null) nearest = body;
            else if (body.getAbsolutePosition().lengthSquared() < nearest.getAbsolutePosition().lengthSquared()) {
                nearest = body;
            }
        }
        return nearest!;
    }

    /**
     * Returns the most influential body at a given point
     */
    public getMostInfluentialBodyAtPoint(point: Vector3): CelestialBody {
        if (this.getBodies().length == 0) throw new Error("There are no bodies in the solar system");
        let nearest = null;
        for (const body of this._celestialBodies) {
            if (nearest == null) nearest = body;
            else if (body.physicalProperties.mass / body.getAbsolutePosition().lengthSquared() > nearest.physicalProperties.mass / nearest.getAbsolutePosition().lengthSquared()) {
                nearest = body;
            }
        }
        return nearest!;
    }

    public getTime() {
        return this.clock;
    }

    public update(player: PlayerController, lightOrigin: Vector3, depthRenderer: DepthRenderer, deltaTime: number): void {
        this.clock += deltaTime;

        this._chunkForge.update(depthRenderer);
        for (const body of this.getBodies()) body.update(player, lightOrigin, deltaTime);

        this.translateAllCelestialBody(player.getAbsolutePosition().scale(-1));
        player.translate(player.getAbsolutePosition().scale(-1));
    }
}
