import { OrbitalObjectType } from "../architecture/orbitalObject";
import { GasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { TelluricSatelliteModel } from "../planets/telluricPlanet/telluricSatelliteModel";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { getObjectModelByUniverseId } from "../utils/coordinates/orbitalObjectId";
import { UniverseObjectId } from "../utils/coordinates/universeCoordinates";
import { EncyclopaediaGalactica, SpaceDiscoveryData } from "./encyclopaediaGalactica";

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

    private evaluateTelluricPlanetMultiplier(model: TelluricPlanetModel) {
        let multiplier = 1;
        if (model.clouds !== null) multiplier += 1.0;
        if (model.rings !== null) multiplier += 1.0;

        return multiplier;
    }

    private evaluateTelluricSatelliteMultiplier(model: TelluricSatelliteModel) {
        let multiplier = 0.5;
        if (model.clouds !== null) multiplier += 1.0;
        if (model.rings !== null) multiplier += 1.0;

        return multiplier;
    }

    private evaluateGasPlanetMultiplier(model: GasPlanetModel) {
        let multiplier = 1;
        if (model.rings !== null) multiplier += 1.0;

        return multiplier;
    }

    public async estimateDiscovery(object: UniverseObjectId): Promise<number> {
        if (await this.hasObjectBeenDiscovered(object)) {
            return Promise.resolve(this.redundantDataPrice);
        }

        const model = getObjectModelByUniverseId(object, this.starSystemDatabase);
        if (model === null) {
            return Promise.reject("Object model not found for object ID");
        }
        const systemGalacticPosition = this.starSystemDatabase.getSystemGalacticPosition(object.starSystemCoordinates);

        const distanceFromSolLy = systemGalacticPosition.length();

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
                objectTypeMultiplier = this.evaluateTelluricPlanetMultiplier(model as TelluricPlanetModel);
                break;
            case OrbitalObjectType.TELLURIC_SATELLITE:
                objectTypeMultiplier = this.evaluateTelluricSatelliteMultiplier(model as TelluricSatelliteModel);
                break;
            case OrbitalObjectType.GAS_PLANET:
                objectTypeMultiplier = this.evaluateGasPlanetMultiplier(model as GasPlanetModel);
                break;
            case OrbitalObjectType.MANDELBULB:
                objectTypeMultiplier = 2;
                break;
            case OrbitalObjectType.JULIA_SET:
                objectTypeMultiplier = 2;
                break;
            case OrbitalObjectType.MANDELBOX:
                objectTypeMultiplier = 2;
                break;
            case OrbitalObjectType.SPACE_STATION:
            case OrbitalObjectType.SPACE_ELEVATOR:
                objectTypeMultiplier = 0;
                break;
        }

        return Promise.resolve(Math.ceil(valueFromDistance * objectTypeMultiplier));
    }

    public reset() {
        this.spaceExplorationData.clear();
    }

    public getBackendString(): string {
        return "Local";
    }
}
