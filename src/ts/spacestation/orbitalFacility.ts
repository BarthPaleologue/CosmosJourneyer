import { OrbitalObject, OrbitalObjectModel, OrbitalObjectType } from "../architecture/orbitalObject";
import { ManagesLandingPads } from "../utils/managesLandingPads";
import { Cullable } from "../utils/cullable";
import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { CropType } from "../utils/agriculture";
import { Faction } from "../society/factions";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Transformable } from "../architecture/transformable";

export type OrbitalFacilityModel = OrbitalObjectModel & {
    readonly starSystemCoordinates: StarSystemCoordinates;

    readonly type: OrbitalObjectType.SPACE_STATION | OrbitalObjectType.SPACE_ELEVATOR;

    readonly population: number;

    /**
     * The average energy consumption of a citizen of the habitat in KWh
     */
    readonly energyConsumptionPerCapitaKWh: number;

    /**
     * The number of inhabitants per square kilometer in the habitat
     */
    readonly populationDensity: number;

    readonly agricultureMix: [number, CropType][];

    readonly nbHydroponicLayers: number;

    readonly faction: Faction;

    /**
     * The total energy consumption of the habitat in KWh
     */
    readonly totalEnergyConsumptionKWh: number;
    readonly solarPanelEfficiency: number;

    /**
     * The surface of solar panels in m²
     */
    readonly solarPanelSurfaceM2: number;

    readonly housingSurfaceHa: number;
    readonly agricultureSurfaceHa: number;
    readonly totalHabitatSurfaceM2: number;
};

export interface OrbitalFacility extends OrbitalObject, ManagesLandingPads, Cullable {
    readonly model: OrbitalFacilityModel;

    update(stellarObjects: Transformable[], parents: OrbitalObject[], cameraWorldPosition: Vector3, deltaSeconds: number): void;
}
