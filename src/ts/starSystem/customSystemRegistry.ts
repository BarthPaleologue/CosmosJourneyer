import { StarSystemModel } from "./starSystemModel";
import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";

export class CustomSystemRegistry {
    private static StarSectorToSystems = new Map<string, StarSystemModel[]>();

    private static CoordinatesToSystems = new Map<string, StarSystemModel>();

    private static StarSectorToString(sectorX: number, sectorY: number, sectorZ: number): string {
        return `${sectorX}|${sectorY}|${sectorZ}`;
    }

    public static RegisterSystem(system: StarSystemModel) {
        const sectorKey = this.StarSectorToString(system.coordinates.starSectorX, system.coordinates.starSectorY, system.coordinates.starSectorZ);
        const systems = CustomSystemRegistry.StarSectorToSystems.get(sectorKey);
        if (systems === undefined) {
            CustomSystemRegistry.StarSectorToSystems.set(sectorKey, [system]);
        } else {
            systems.push(system);
        }

        CustomSystemRegistry.CoordinatesToSystems.set(JSON.stringify(system.coordinates), system);
    }

    public static GetSystemsFromSector(sectorX: number, sectorY: number, sectorZ: number): StarSystemModel[] {
        const sectorKey = this.StarSectorToString(sectorX, sectorY, sectorZ);
        const systems = CustomSystemRegistry.StarSectorToSystems.get(sectorKey);
        if (systems === undefined) {
            return [];
        }
        return systems;
    }

    public static GetSystemFromCoordinates(coordinates: StarSystemCoordinates): StarSystemModel | undefined {
        return CustomSystemRegistry.CoordinatesToSystems.get(JSON.stringify(coordinates));
    }
}
