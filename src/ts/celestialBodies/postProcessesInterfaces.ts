import {PlanetPostProcess} from "../postProcesses/planetPostProcess";
import {AtmosphericScatteringPostProcess} from "../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import {OceanPostProcess} from "../postProcesses/planetPostProcesses/oceanPostProcess";
import {FlatCloudsPostProcess} from "../postProcesses/planetPostProcesses/flatCloudsPostProcess";
import {RingsPostProcess} from "../postProcesses/planetPostProcesses/ringsPostProcess";
import {PostProcess, VolumetricLightScatteringPostProcess} from "@babylonjs/core";

export interface BodyPostProcesses {
    [details: string]: PostProcess | null;
}

export interface PlanetPostProcesses extends BodyPostProcesses {
    [details: string]: PlanetPostProcess | null;

    atmosphere: AtmosphericScatteringPostProcess | null;
    ocean: OceanPostProcess | null;
    clouds: FlatCloudsPostProcess | null;
    rings: RingsPostProcess | null;
}

export interface StarPostProcesses extends BodyPostProcesses {
    volumetricLight: VolumetricLightScatteringPostProcess | null;
}