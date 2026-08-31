export const LightYearPerParsec = 3.26156;
export type QueryConfig = Readonly<{
    radiusLy: number;
    parallaxOverErrorMin: number;
    ruweMax: number;
    temperatureMin?: number;
    limit?: number;
}>;
export type GridConfig = Readonly<{
    gridSize: number;
    halfExtent: number;
}>;
export const computeParallaxMinMas = (config: QueryConfig): number => 1000 / (config.radiusLy / LightYearPerParsec);
export const cubeIndexFor = (config: GridConfig, coordinate: number): number =>
    Math.floor(coordinate / config.gridSize);
export const cubeOrigin = (config: GridConfig, index: number): number => index * config.gridSize;
export const contains = (config: GridConfig, coordinate: number): boolean =>
    coordinate >= -config.halfExtent && coordinate <= config.halfExtent;
