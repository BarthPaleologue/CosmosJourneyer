import { Matrix, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { IPatch } from "../planets/telluricPlanet/terrain/instancePatch/iPatch";
import { InstancePatch } from "../planets/telluricPlanet/terrain/instancePatch/instancePatch";
import { Objects } from "../assets/objects";

export class AsteroidBelt {
    
    readonly parent: TransformNode;

    readonly averageRadius: number;
    readonly spread: number;
    
    readonly minRadius: number;
    readonly maxRadius: number;

    readonly resolution = 4;
    readonly patchSize = 10;

    readonly windowMaxRadius = 4;

    private readonly patches = new Map<string, { patch: IPatch, cell: [number, number] }>();
    
    constructor(parent: TransformNode, averageRadius: number, spread: number) {
        this.parent = parent;
        
        this.averageRadius = averageRadius;
        this.spread = spread;

        this.minRadius = averageRadius - spread;
        this.maxRadius = averageRadius + spread;
    }

    public update(cameraWorldPosition: Vector3) {
        const planetInverseWorld = this.parent.getWorldMatrix().clone().invert();

        const cameraLocalPosition = Vector3.TransformCoordinates(cameraWorldPosition, planetInverseWorld);
    
        const cameraCellX = Math.round(cameraLocalPosition.x / this.patchSize);
        const cameraCellY = Math.round(cameraLocalPosition.y / this.patchSize);
        const cameraCellZ = Math.round(cameraLocalPosition.z / this.patchSize);
    
        // remove patches too far away
        for (const [key, value] of this.patches) {
            const [patchCellX, patchCellZ] = value.cell;
            const patch = value.patch;
    
            if ((cameraCellX - patchCellX) ** 2 + cameraCellY * cameraCellY + (cameraCellZ - patchCellZ) ** 2 >= this.windowMaxRadius * this.windowMaxRadius) {
                patch.clearInstances();
                patch.dispose();
    
                this.patches.delete(key);
            }
        }
    
        // create new patches
        for (let x = -this.windowMaxRadius; x <= this.windowMaxRadius; x++) {
            for (let z = -this.windowMaxRadius; z <= this.windowMaxRadius; z++) {
                const cellX = cameraCellX + x;
                const cellZ = cameraCellZ + z;
    
                const radiusSquared = (cellX * this.patchSize) ** 2 + (cellZ * this.patchSize) ** 2;
                if (radiusSquared < this.minRadius * this.minRadius || radiusSquared > this.maxRadius * this.maxRadius) continue;
    
                if (this.patches.has(`${cellX};${cellZ}`)) continue;
    
                if ((cameraCellX - cellX) ** 2 + cameraCellY * cameraCellY + (cameraCellZ - cellZ) ** 2 >= this.windowMaxRadius * this.windowMaxRadius) continue;
    
                const matrixBuffer = AsteroidBelt.CreateAsteroidBuffer(new Vector3(cellX * this.patchSize, 0, cellZ * this.patchSize), this.resolution, this.patchSize);
                const patch = new InstancePatch(this.parent, matrixBuffer);
                patch.createInstances(Objects.ROCK);
    
                this.patches.set(`${cellX};${cellZ}`, { patch: patch, cell: [cellX, cellZ] });
            }
        }
    }

    static CreateAsteroidBuffer(position: Vector3, resolution: number, patchSize: number): Float32Array {
        const matrixBuffer = new Float32Array(resolution * resolution * 16);
        const cellSize = patchSize / resolution;
        let index = 0;
        for (let x = 0; x < resolution; x++) {
            for (let z = 0; z < resolution; z++) {
                const randomCellPositionX = Math.random() * cellSize;
                const randomCellPositionZ = Math.random() * cellSize;
                const positionX = position.x + x * cellSize - patchSize / 2 + randomCellPositionX;
                const positionZ = position.z + z * cellSize - patchSize / 2 + randomCellPositionZ;
                const positionY = (Math.random() - 0.5) * 3.0;
                const scaling = 0.7 + Math.random() * 0.6;
    
                const matrix = Matrix.Compose(
                    new Vector3(scaling, scaling, scaling),
                    Quaternion.RotationAxis(Vector3.Up(), Math.random() * 2 * Math.PI),
                    new Vector3(positionX, positionY, positionZ)
                );
                matrix.copyToArray(matrixBuffer, 16 * index);
    
                index += 1;
            }
        }
    
        return matrixBuffer;
    }
}