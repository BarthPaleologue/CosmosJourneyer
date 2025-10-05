import { type GasPlanetModel } from "@/backend/universe/orbitalObjects/gasPlanetModel";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { type TelluricPlanetModel } from "@/backend/universe/orbitalObjects/telluricPlanetModel";
import { type TelluricSatelliteModel } from "@/backend/universe/orbitalObjects/telluricSatelliteModel";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";
import { type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { err, ok, type DeepReadonly, type Result } from "@/utils/types";

import { type EncyclopaediaGalactica, type SpaceDiscoveryData } from "./encyclopaediaGalactica";

export class EncyclopaediaGalacticaLocal implements EncyclopaediaGalactica {
    /**
     * This maps object IDs (as JSON strings) to the data gathered about them.
     */
    private readonly spaceExplorationData: Map<string, SpaceDiscoveryData> = new Map();

    /**
     * Because an object has already been discovered does not mean new data on it has no value.
     * This is the symbolic price of redundant data.
     */
    private readonly redundantDataPrice = 100;

    private readonly starSystemDatabase: StarSystemDatabase;

    constructor(starSystemDatabase: StarSystemDatabase) {
        this.starSystemDatabase = starSystemDatabase;
    }

    public contributeDiscoveryIfNew(data: SpaceDiscoveryData): Promise<boolean> {
        const key = JSON.stringify(data.objectId);

        const previousData = this.spaceExplorationData.get(key);
        if (previousData !== undefined && previousData.discoveryTimestamp >= data.discoveryTimestamp) {
            return Promise.resolve(false); // The object was already discovered and the new data is older.
        }

        this.spaceExplorationData.set(key, data);
        return Promise.resolve(true);
    }

    public hasObjectBeenDiscovered(objectId: UniverseObjectId): Promise<boolean> {
        return Promise.resolve(this.spaceExplorationData.has(JSON.stringify(objectId)));
    }

    private evaluateTelluricPlanetMultiplier(model: DeepReadonly<TelluricPlanetModel>) {
        let multiplier = 1;
        if (model.clouds !== null) multiplier += 1.0;
        if (model.rings !== null) multiplier += 1.0;

        return multiplier;
    }

    private evaluateTelluricSatelliteMultiplier(model: DeepReadonly<TelluricSatelliteModel>) {
        let multiplier = 0.5;
        if (model.clouds !== null) multiplier += 1.0;

        return multiplier;
    }

    private evaluateGasPlanetMultiplier(model: DeepReadonly<GasPlanetModel>) {
        let multiplier = 1;
        if (model.rings !== null) multiplier += 1.0;

        return multiplier;
    }

    public async estimateDiscovery(object: UniverseObjectId): Promise<Result<number, string>> {
        if (await this.hasObjectBeenDiscovered(object)) {
            return ok(this.redundantDataPrice);
        }

        const model = this.starSystemDatabase.getObjectModelByUniverseId(object);
        if (model === null) {
            return err("Object model not found for object ID");
        }
        const systemGalacticPosition = this.starSystemDatabase.getSystemGalacticPosition(object.systemCoordinates);

        const distanceFromSolLy = Math.hypot(
            systemGalacticPosition.x,
            systemGalacticPosition.y,
            systemGalacticPosition.z,
        );

        const valueFromDistance = distanceFromSolLy * 100;

        let objectTypeMultiplier: number;
        switch (model.type) {
            case OrbitalObjectType.STAR:
                objectTypeMultiplier = 1;
                break;
            case OrbitalObjectType.NEUTRON_STAR:
                objectTypeMultiplier = 8;
                break;
            case OrbitalObjectType.BLACK_HOLE:
                objectTypeMultiplier = 10;
                break;
            case OrbitalObjectType.TELLURIC_PLANET:
                objectTypeMultiplier = this.evaluateTelluricPlanetMultiplier(model);
                break;
            case OrbitalObjectType.TELLURIC_SATELLITE:
                objectTypeMultiplier = this.evaluateTelluricSatelliteMultiplier(model);
                break;
            case OrbitalObjectType.GAS_PLANET:
                objectTypeMultiplier = this.evaluateGasPlanetMultiplier(model);
                break;
            case OrbitalObjectType.MANDELBULB:
            case OrbitalObjectType.JULIA_SET:
            case OrbitalObjectType.MANDELBOX:
            case OrbitalObjectType.SIERPINSKI_PYRAMID:
            case OrbitalObjectType.MENGER_SPONGE:
                objectTypeMultiplier = 2;
                break;
            case OrbitalObjectType.SPACE_STATION:
            case OrbitalObjectType.SPACE_ELEVATOR:
            case OrbitalObjectType.DARK_KNIGHT:
            case OrbitalObjectType.CUSTOM:
                objectTypeMultiplier = 0;
                break;
        }

        return ok(Math.ceil(valueFromDistance * objectTypeMultiplier));
    }

    public reset() {
        this.spaceExplorationData.clear();
    }

    public getBackendString(): string {
        return "Local";
    }
}
