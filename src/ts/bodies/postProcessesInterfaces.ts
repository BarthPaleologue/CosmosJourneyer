import { PlanetPostProcess } from "../postProcesses/planetPostProcess";
import { AtmosphericScatteringPostProcess } from "../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { OceanPostProcess } from "../postProcesses/planetPostProcesses/oceanPostProcess";
import { FlatCloudsPostProcess } from "../postProcesses/planetPostProcesses/flatCloudsPostProcess";
import { RingsPostProcess } from "../postProcesses/planetPostProcesses/ringsPostProcess";
import { PostProcess, VolumetricLightScatteringPostProcess } from "@babylonjs/core";

export type BodyPostProcesses = {
    [details: string]: PostProcess | null;
    rings: RingsPostProcess | null;
};

export type PlanetPostProcesses = BodyPostProcesses & {
    [details: string]: PlanetPostProcess | null;

    atmosphere: AtmosphericScatteringPostProcess | null;
    ocean: OceanPostProcess | null;
    clouds: FlatCloudsPostProcess | null;
};

export type StarPostProcesses = BodyPostProcesses & {
    volumetricLight: VolumetricLightScatteringPostProcess;
};
