import {Quaternion} from "@babylonjs/core";

import {CollisionData} from "../forge/CollisionData";
import {StarSystemManager} from "../celestialBodies/starSystemManager";
import {PlayerController} from "../player/playerController";
import {PlanetWorker} from "./planetWorker";
import {Algebra} from "../toolbox/algebra";
import {CelestialBody, CelestialBodyType} from "../celestialBodies/celestialBody";
import {SolidPlanet} from "../celestialBodies/planets/solid/solidPlanet";

export class CollisionWorker extends PlanetWorker {
    _player: PlayerController;
    _busy = false;
    constructor(player: PlayerController, planetManager: StarSystemManager) {
        super();
        this._player = player;
        this._worker.onmessage = e => {
            if (player.nearestBody == null) return;

            let direction = player.nearestBody.getAbsolutePosition().normalizeToNew();
            let currentHeight = player.nearestBody.getAbsolutePosition().length();
            let terrainHeight = e.data.h;

            let currentPosition = player.nearestBody.getAbsolutePosition();
            let newPosition = currentPosition;

            if (currentHeight - player.collisionRadius < terrainHeight) {
                newPosition = direction.scale(terrainHeight + player.collisionRadius);
            }

            let deviation = newPosition.subtract(currentPosition);

            planetManager.translateAllCelestialBody(deviation);

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
    public checkCollision(planet: CelestialBody): void {
        let position = planet.getAbsolutePosition().clone(); // position de la planète / au joueur
        position.scaleInPlace(-1); // position du joueur / au centre de la planète

        // on applique le quaternion inverse pour obtenir le sample point correspondant à la planète rotatée (fais un dessin si c'est pas clair)
        Algebra.applyQuaternionInPlace(Quaternion.Inverse(planet.getRotationQuaternion()), position);

        if(planet.getBodyType() == CelestialBodyType.SOLID) {
            //TODO: improve cast system
            this.send({
                taskType: "collisionTask",
                planetID: planet.getName(),
                terrainSettings: (<SolidPlanet><unknown>planet).terrainSettings,
                position: [
                    position.x,
                    position.y,
                    position.z
                ],
                chunkLength: (<SolidPlanet><unknown>planet).rootChunkLength,
                craters: (<SolidPlanet><unknown>planet).craters
            });
        }
    }
}