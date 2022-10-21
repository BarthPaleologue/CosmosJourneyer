import { AtmosphericScatteringPostProcess } from "../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { FlatCloudsPostProcess } from "../postProcesses/planetPostProcesses/flatCloudsPostProcess";
import { RingsPostProcess } from "../postProcesses/planetPostProcesses/ringsPostProcess";
import { VolumetricLight } from "../postProcesses/volumetricLight";
import { IPostProcess } from "../postProcesses/iPostProcess";
import { BlackHolePostProcess } from "../postProcesses/planetPostProcesses/blackHolePostProcess";
import { OverlayPostProcess } from "../postProcesses/overlayPostProcess";

export type BodyPostProcesses = {
    [details: string]: IPostProcess | boolean | null;
    rings: RingsPostProcess | null;
    overlay: OverlayPostProcess | null;
};

export type PlanetPostProcesses = BodyPostProcesses & {
    atmosphere: AtmosphericScatteringPostProcess | null;
};

export type TelluricPlanetPostProcesses = PlanetPostProcesses & {
    ocean: boolean;
    clouds: boolean;
};

export type StarPostProcesses = BodyPostProcesses & {
    volumetricLight: VolumetricLight;
};

export type BlackHolePostProcesses = BodyPostProcesses & {
    blackHole: BlackHolePostProcess;
};
