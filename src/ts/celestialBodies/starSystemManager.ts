import {Vector3, DepthRenderer} from "@babylonjs/core";

import { ChunkForge } from "../forge/chunkForge";
import { PlayerController } from "../player/playerController";
import { SolidPlanet } from "./planets/solid/solidPlanet";
import {CelestialBody} from "./celestialBody";
import {Star} from "./stars/star";

export class StarSystemManager {
    private readonly _chunkForge: ChunkForge;
    private readonly _celestialBodies: CelestialBody[] = [];
    constructor(nbVertices = 64) {
        this._chunkForge = new ChunkForge(nbVertices);
    }
    private addBody(body: CelestialBody) {
        this._celestialBodies.push(body);
    }
    public addStar(star: Star): void {
        this.addBody(star);
    }
    public addSolidPlanet(planet: SolidPlanet): void {
        planet.setChunkForge(this._chunkForge);
        this.addBody(planet);
    }
    public translateAllCelestialBody(deplacement: Vector3): void {
        for (const planet of this._celestialBodies) {
            planet.setAbsolutePosition(planet.getAbsolutePosition().add(deplacement));
        }
    }
    public rotateAllAround(pivot: Vector3, axis: Vector3, amount: number) {
        for(const planet of this._celestialBodies) {
            planet.rotateAround(pivot, axis, amount);
        }
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
    public getNearestBody(): CelestialBody | null {
        let nearest = null;
        for (const body of this._celestialBodies) {
            if (nearest == null) nearest = body;
            else if (body.getAbsolutePosition().lengthSquared() < nearest.getAbsolutePosition().lengthSquared()) {
                nearest = body;
            }
        }
        return nearest;
    }
    public update(player: PlayerController, lightOrigin: Vector3, depthRenderer: DepthRenderer, deltaTime: number): void {
        this._chunkForge.update(depthRenderer);
        // TODO : il faudra update les planètes des plus lointaines au plus proches quand il y aura les postprocess
        for (const body of this._celestialBodies) {
            body.update(player, lightOrigin, deltaTime);
        }
        this.translateAllCelestialBody(player.getAbsolutePosition().scale(-1));
        player.translate(player.getAbsolutePosition().scale(-1));
    }
}