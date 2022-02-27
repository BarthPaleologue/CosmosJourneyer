import { AbstractPlanet } from "../abstractPlanet";
import {CelestialBodyType} from "../../celestialBody";

export class GazPlanet extends AbstractPlanet {
    protected bodyType = CelestialBodyType.GAZ;

    constructor(name: string, radius: number) {
        super(name, radius);
    }

    setAbsolutePosition(newPosition: BABYLON.Vector3): void {
        //TODO: set absolute position of gaz giant
    }

    getAbsolutePosition(): BABYLON.Vector3 {
        //TODO: return the true value
        return BABYLON.Vector3.Zero();
    }
    public getRotationQuaternion(): BABYLON.Quaternion {
        throw new Error("Method not implemented.");
    }

    update(observerPosition: BABYLON.Vector3, observerDirection: BABYLON.Vector3, lightPosition: BABYLON.Vector3): void {
        // TODO: update planet
    }
}