export type GaiaSourceId = string;
export type SimbadMetadata = Readonly<{
    name: string;
    spectralType: string | null;
    objectType: string | null;
    effectiveTemperature: number | null;
}>;
