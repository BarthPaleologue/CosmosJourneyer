import { Vector3 } from "@babylonjs/core";

import { AbstractPlanet } from "./abstractPlanet";
import { BodyType } from "../interfaces";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { PlanetPhysicalProperties } from "../physicalPropertiesInterfaces";

export class GazPlanet extends AbstractPlanet {
    protected bodyType = BodyType.GAZ;

    override readonly physicalProperties: PlanetPhysicalProperties;

    constructor(name: string, radius: number, starSystemManager: StarSystemManager) {
        super(name, radius, starSystemManager);
        this.physicalProperties = {
            // FIXME: choose physically accurates values
            mass: 20,
            rotationPeriod: 24 * 60 * 60,
            minTemperature: 100,
            maxTemperature: 110,
            pressure: 1
        };
    }

    public override update(player: PlayerController, lightPosition: Vector3, deltaTime: number): void {
        super.update(player, lightPosition, deltaTime);
    }
}
