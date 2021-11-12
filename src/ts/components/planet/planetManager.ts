import { ChunkForge } from "../forge/chunkForge";
import { PlayerControler } from "../player/playerControler";
import { Planet } from "./planet";

export class PlanetManager {
    private _chunkForge: ChunkForge;
    private _planets: Planet[] = [];
    constructor(nbVertices = 64) {
        this._chunkForge = new ChunkForge(nbVertices);
    }
    public add(planet: Planet): void {
        planet.setChunkForge(this._chunkForge);
        this._planets.push(planet);
    }
    public moveEverything(deplacement: BABYLON.Vector3): void {
        for (const planet of this._planets) {
            planet.attachNode.setAbsolutePosition(planet.getAbsolutePosition().add(deplacement));
        }
    }
    public getPlanets(): Planet[] {
        return this._planets;
    }
    public getNearestPlanet(position: BABYLON.Vector3): Planet | null {
        let nearest = null;
        for (const planet of this._planets) {
            if (nearest == null) nearest = planet;
            else if (planet.attachNode.absolutePosition.lengthSquared() < nearest.getAbsolutePosition().lengthSquared()) {
                nearest = planet;
            }
        }
        return nearest;
    }
    public update(player: PlayerControler, lightOrigin: BABYLON.Vector3, depthRenderer: BABYLON.DepthRenderer): void {
        this._chunkForge.update(depthRenderer);
        // TODO : il faudra update les planètes des plus lointaines au plus proches quand il y aura les postprocess
        for (const planet of this._planets) {
            planet.update(player.mesh.position, lightOrigin, player.camera);
        }
    }
}