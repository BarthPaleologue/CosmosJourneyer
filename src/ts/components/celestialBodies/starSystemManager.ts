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
    public addStar(star: Star): void {
        this._celestialBodies.push(star);
    }
    public addSolidPlanet(planet: SolidPlanet): void {
        planet.setChunkForge(this._chunkForge);
        this._celestialBodies.push(planet);
    }
    public translateAllCelestialBody(deplacement: Vector3): void {
        for (const planet of this._celestialBodies) {
            planet.setAbsolutePosition(planet.getAbsolutePosition().add(deplacement));
        }
    }
    public getPlanets(): CelestialBody[] {
        return this._celestialBodies;
    }
    public getNearestPlanet(): CelestialBody | null {
        let nearest = null;
        for (const planet of this._celestialBodies) {
            if (nearest == null) nearest = planet;
            else if (planet.getAbsolutePosition().lengthSquared() < nearest.getAbsolutePosition().lengthSquared()) {
                nearest = planet;
            }
        }
        return nearest;
    }
    public update(player: PlayerController, lightOrigin: Vector3, depthRenderer: DepthRenderer): void {
        this._chunkForge.update(depthRenderer);
        // TODO : il faudra update les planètes des plus lointaines au plus proches quand il y aura les postprocess
        for (const planet of this._celestialBodies) {
            planet.update(player.mesh.position, player.getForwardDirection(), lightOrigin);
        }
    }
}