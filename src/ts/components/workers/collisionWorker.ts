import { CollisionData } from "../forge/CollisionData";
import { SolidPlanet } from "../planet/solid/planet";
import { PlanetManager } from "../planet/planetManager";
import { PlayerControler } from "../player/playerControler";
import { PlanetWorker } from "./planetWorker";
import { Vector3 } from "../toolbox/algebra";

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
    public checkCollision(planet: SolidPlanet): void {
        let position = Vector3.FromBABYLON3(planet.getAbsolutePosition()); // position de la planète / au joueur
        position.scaleInPlace(-1); // position du joueur / au centre de la planète

        // on applique le quaternion inverse pour obtenir le sample point correspondant à la planète rotatée (fais un dessin si c'est pas clair)
        position.applyQuaternionInPlace(BABYLON.Quaternion.Inverse(planet.attachNode.rotationQuaternion!));

        this.send({
            taskType: "collisionTask",
            planetID: planet._name,
            terrainSettings: planet.terrainSettings,
            position: [
                position.x,
                position.y,
                position.z
            ],
            chunkLength: planet.rootChunkLength,
            craters: planet.craters
        });
    }
}