import { AtmosphericScatteringPostProcess } from "../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { OceanPostProcess } from "../postProcesses/planetPostProcesses/oceanPostProcess";
import { FlatCloudsPostProcess } from "../postProcesses/planetPostProcesses/flatCloudsPostProcess";
import { RingsPostProcess } from "../postProcesses/planetPostProcesses/ringsPostProcess";
import { VolumetricLight } from "../postProcesses/volumetricLight";
import { IPostProcess } from "../postProcesses/iPostProcess";
import { BlackHolePostProcess } from "../postProcesses/planetPostProcesses/blackHolePostProcess";

export type BodyPostProcesses = {
    [details: string]: IPostProcess | null;
    rings: RingsPostProcess | null;
};

export type PlanetPostProcesses = BodyPostProcesses & {
    atmosphere: AtmosphericScatteringPostProcess | null;
};

export type TelluricPlanetPostProcesses = PlanetPostProcesses & {
    ocean: OceanPostProcess | null;
    clouds: FlatCloudsPostProcess | null;
};

export type StarPostProcesses = BodyPostProcesses & {
    volumetricLight: VolumetricLight;
};

export type BlackHolePostProcesses = BodyPostProcesses & {
    blackHole: BlackHolePostProcess;
};
