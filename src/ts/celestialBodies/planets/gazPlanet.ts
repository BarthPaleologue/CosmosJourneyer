import {Vector3, Quaternion} from "@babylonjs/core";

import {AbstractPlanet} from "./abstractPlanet";
import {CelestialBodyType} from "../interfaces";
import {PlayerController} from "../../player/playerController";
import {StarSystemManager} from "../starSystemManager";
import {PlanetPhysicalProperties} from "../physicalPropertiesInterfaces";

export class GazPlanet extends AbstractPlanet {
    protected bodyType = CelestialBodyType.GAZ;

    override readonly physicalProperties: PlanetPhysicalProperties;

    constructor(name: string, radius: number, starSystemManager: StarSystemManager) {
        super(name, radius, starSystemManager);
        this.physicalProperties = {
            // FIXME: choose physically accurates values
            mass: 20,
            rotationPeriod: 24 * 60 * 60,
            rotationAxis: new Vector3(0, 1, 0),
            minTemperature: 100,
            maxTemperature: 110,
            pressure: 1
        }
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

    update(player: PlayerController, lightPosition: Vector3): void {
        // TODO: update planet
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