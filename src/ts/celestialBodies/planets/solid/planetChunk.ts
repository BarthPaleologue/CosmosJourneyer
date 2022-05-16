import {Mesh} from "@babylonjs/core";

import {SolidPlanet} from "./solidPlanet";
import {ChunkForge} from "../../../forge/chunkForge";
import {BuildTask, TaskType} from "../../../forge/taskInterfaces";
import {Direction} from "../../../utils/direction";
import {getChunkPlaneSpacePositionFromPath} from "../../../utils/chunkUtils";

export class PlanetChunk {

    public readonly mesh: Mesh;
    public readonly depth: number;
    private ready = false;

    constructor(path: number[], direction: Direction, chunkForge: ChunkForge, planet: SolidPlanet, isFiner: boolean) {
        let id = `D${direction}P${path.join("")}`;

        this.depth = path.length;

        this.mesh = new Mesh(`Chunk${id}`, planet.attachNode.getScene());
        this.mesh.setEnabled(false);
        this.mesh.material = planet.surfaceMaterial;
        this.mesh.parent = planet.attachNode;

        // computing the position of the chunk on the side of the planet
        this.mesh.position = getChunkPlaneSpacePositionFromPath(planet.getDiameter(), path);

        // offseting from planet center to position on the side (default side then rotation for all sides)
        this.mesh.position.z -= planet.getRadius();

        let buildTask: BuildTask = {
            taskType: TaskType.Build,
            planet: planet,
            position: this.mesh.position.clone(),
            depth: path.length,
            direction: direction,
            chunk: this,
            isFiner: isFiner
        }

        chunkForge.addTask(buildTask);

        // TODO: put this somewhere else
        // sphérisation du cube
        // note : on sphérise après car le worker script calcule les positions à partir du cube
        this.mesh.position.normalize();
        this.mesh.position.scaleInPlace(planet.getRadius());
    }

    public isReady() {
        return this.ready;
    }

    public markAsReady() {
        this.ready = true;
        this.mesh.setEnabled(true);
    }

    public markAsNotReady() {
        this.ready = false;
        this.mesh.setEnabled(false);
    }

    public dispose() {
        this.mesh.dispose();
    }
}