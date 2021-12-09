import { ChunkForge } from "../forge/chunkForge";
import { PlayerControler } from "../player/playerControler";
import { SolidPlanet } from "./solid/planet";

export class PlanetManager {
    private readonly _chunkForge: ChunkForge;
    private readonly _planets: SolidPlanet[] = [];
    constructor(nbVertices = 64) {
        this._chunkForge = new ChunkForge(nbVertices);
    }
    public add(planet: SolidPlanet): void {
        planet.setChunkForge(this._chunkForge);
        this._planets.push(planet);
    }
    public moveEverything(deplacement: BABYLON.Vector3): void {
        for (const planet of this._planets) {
            planet.attachNode.setAbsolutePosition(planet.getAbsolutePosition().add(deplacement));
        }
    }
    public getPlanets(): SolidPlanet[] {
        return this._planets;
    }
    public getNearestPlanet(): SolidPlanet | null {
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
            planet.update(player.mesh.position, lightOrigin);
        }
    }
}