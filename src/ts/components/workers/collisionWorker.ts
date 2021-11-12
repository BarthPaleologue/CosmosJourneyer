import { CollisionData } from "../forge/CollisionData";
import { Planet } from "../planet/planet";
import { PlanetManager } from "../planet/planetManager";
import { PlayerControler } from "../player/playerControler";
import { PlanetWorker } from "./planetWorker";

export class CollisionWorker extends PlanetWorker {
    _player: PlayerControler;
    _busy = false;
    // TODO : suppr la light lors de la création du nouveau soleil
    constructor(player: PlayerControler, planetManager: PlanetManager, light: BABYLON.Mesh) {
        super();
        this._player = player;
        this._worker.onmessage = e => {
            if (player.nearestPlanet == null) return;

            let direction = player.nearestPlanet.getAbsolutePosition().normalizeToNew();
            let currentHeight = player.nearestPlanet.getAbsolutePosition().length();
            let terrainHeight = e.data.h;

            let currentPosition = player.nearestPlanet.attachNode.absolutePosition;
            let newPosition = currentPosition;

            if (currentHeight - player.collisionRadius < terrainHeight) {
                newPosition = direction.scale(terrainHeight + player.collisionRadius);
            }

            let deviation = newPosition.subtract(currentPosition);

            planetManager.moveEverything(deviation);
            light.position.addInPlace(deviation);

            this._busy = false;
        };
    }
    public isBusy(): boolean {
        return this._busy;
    }
    public override send(data: CollisionData): void {
        super.send(data);
        this._busy = true;
    }
    public checkCollision(planet: Planet): void {
        this.send({
            taskType: "collisionTask",
            planetID: planet.id,
            terrainSettings: planet.terrainSettings,
            position: [
                -planet.getAbsolutePosition().x,
                -planet.getAbsolutePosition().y,
                -planet.getAbsolutePosition().z
            ],
            chunkLength: planet.chunkLength,
            craters: planet.craters
        });
    }
}