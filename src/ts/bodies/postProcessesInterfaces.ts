export type BodyPostProcesses = {
    [details: string]: boolean;
    rings: boolean;
    overlay: boolean;
};

export type PlanetPostProcesses = BodyPostProcesses & {
    atmosphere: boolean;
};

export type TelluricPlanetPostProcesses = PlanetPostProcesses & {
    ocean: boolean;
    clouds: boolean;
};

export type StarPostProcesses = BodyPostProcesses & {
    volumetricLight: boolean;
};

export type BlackHolePostProcesses = BodyPostProcesses & {
    blackHole: boolean;
};
