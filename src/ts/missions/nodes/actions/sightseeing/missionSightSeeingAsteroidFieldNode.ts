import { MissionNode } from "../../missionNode";
import { MissionContext } from "../../../missionContext";
import { UniverseObjectIdentifier } from "../../../../saveFile/universeCoordinates";
import { SeededStarSystemModel } from "../../../../starSystem/seededStarSystemModel";
import { SystemSeed } from "../../../../utils/systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CelestialBody } from "../../../../architecture/celestialBody";
import { clamp } from "../../../../utils/math";

export class MissionSightSeeingAsteroidFieldNode implements MissionNode {
    private hasCompletedLock = false;

    private readonly objectId: UniverseObjectIdentifier;

    private readonly targetSystemSeed: SystemSeed;

    constructor(objectId: UniverseObjectIdentifier) {
        this.objectId = objectId;
        this.targetSystemSeed = new SystemSeed(objectId.starSystem.starSectorX, objectId.starSystem.starSectorY, objectId.starSystem.starSectorZ, objectId.starSystem.index);
    }

    isCompleted(): boolean {
        return this.hasCompletedLock;
    }

    updateState(context: MissionContext) {
        if (this.hasCompletedLock) return;

        const currentSystem = context.currentSystem;
        const currentSystemModel = currentSystem.model;
        if (currentSystemModel instanceof SeededStarSystemModel) {
            // Skip if the current system is not the one we are looking for
            if (!currentSystemModel.seed.equals(this.targetSystemSeed)) {
                return;
            }
        }

        const targetObject = currentSystem.getOrbitalObjects().at(this.objectId.orbitalObjectIndex);
        if (targetObject === undefined) {
            throw new Error(`Could not find object with index ${this.objectId.orbitalObjectIndex}`);
        }

        const celestialBody = targetObject as CelestialBody;
        if (celestialBody.getAsteroidField === undefined) {
            throw new Error(`Object with index ${this.objectId.orbitalObjectIndex} is not a celestial body that can have an asteroid field`);
        }

        const asteroidField = celestialBody.getAsteroidField();
        if (asteroidField === null) {
            throw new Error(`Object with index ${this.objectId.orbitalObjectIndex} does not have an asteroid field`);
        }

        const playerPositionWorld = context.playerPosition;

        // everything will be computed in local space from here
        const playerPosition = Vector3.TransformCoordinates(playerPositionWorld, celestialBody.getTransform().getWorldMatrix().clone().invert());

        const projectionOnPlane = new Vector3(playerPosition.x, 0, playerPosition.z);
        const distanceToCenterOfBodyInPlane = projectionOnPlane.length();

        const clampedLocalPosition = projectionOnPlane
            .scaleInPlace(clamp(distanceToCenterOfBodyInPlane, asteroidField.minRadius, asteroidField.maxRadius) / distanceToCenterOfBodyInPlane);

        const distance = Vector3.Distance(playerPosition, clampedLocalPosition);

        const distanceThreshold = 1000;

        if (distance < distanceThreshold) {
            this.hasCompletedLock = true;
        }
    }
}
