import {Vector3, Quaternion} from "@babylonjs/core";

import {AbstractPlanet} from "../abstractPlanet";
import {CelestialBodyType} from "../../interfaces";

export class GazPlanet extends AbstractPlanet {
    protected bodyType = CelestialBodyType.GAZ;

    constructor(name: string, radius: number) {
        super(name, radius);
    }

    setAbsolutePosition(newPosition: Vector3): void {
        //TODO: set absolute position of gaz giant
        throw new Error("Method not implemented.");
    }

    getAbsolutePosition(): Vector3 {
        //TODO: return the true value
        throw new Error("Method not implemented.");
    }

    public getRotationQuaternion(): Quaternion {
        throw new Error("Method not implemented.");
    }

    update(observerPosition: Vector3, observerDirection: Vector3, lightPosition: Vector3): void {
        // TODO: update planet
        throw new Error("Method not implemented.");
    }

    translate(displacement: Vector3): void {
        //TODO: implement
        throw new Error("Method not implemented.");
    }

    rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        //TODO: implement
        throw new Error("Method not implemented.");
    }

    rotate(axis: Vector3, amount: number): void {
        //TODO: implement
        throw new Error("Method not implemented.");
    }
}