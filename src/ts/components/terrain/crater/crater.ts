export interface Crater {
    position: number[];
    radius: number;
    maxDepth: number;
    steepness: number;
}

export function generateCraters(n: number, radiusModifier: number, steepness: number, maxDepth: number): Crater[] {
    let craters: Crater[] = [];
    for (let i = 0; i < n; i++) {
        let r = radiusModifier * 0.1 * (Math.random() ** 16);
        // random spherical coordinates
        let phi = Math.random() * Math.PI * 2;
        let theta = Math.random() * Math.PI;
        let position = [Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)];

        let maxDepth2 = maxDepth * (0.2 + (Math.random()) / 10);
        let steepness2 = steepness * (1 + (Math.random()) / 10) / (r / 2);
        craters.push({ radius: r, position: position, maxDepth: maxDepth2, steepness: steepness2 });
    }
    return craters;
}