export type OrbitalObjectPhysicalProperties = {
  mass: number;
  rotationPeriod: number;
  axialTilt: number;
};

export type StarPhysicalProperties = OrbitalObjectPhysicalProperties & {
  temperature: number;
};

export type BlackHolePhysicalProperties = OrbitalObjectPhysicalProperties & {
  accretionDiskRadius: number;
};

export type PlanetPhysicalProperties = OrbitalObjectPhysicalProperties & {
  minTemperature: number;
  maxTemperature: number;
  pressure: number;
};

export type TelluricPlanetPhysicalProperties = PlanetPhysicalProperties & {
  waterAmount: number;
  oceanLevel: number;
};