import { PlayerControler } from "../player/playerControler";
import { PlanetWorker } from "./planetWorker";

export class CollisionWorker extends PlanetWorker {
    _player: PlayerControler;
    _busy = false;
    constructor(player: PlayerControler) {
        super();
        this._player = player;
        /*this._worker.onmessage = e => {
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

            for (const planet of planets) {
                planet.attachNode.position.addInPlace(deviation);
            }
            sun.position.addInPlace(deviation);
        };*/
    }
    public isBusy(): boolean {
        return this._busy;
    }
}