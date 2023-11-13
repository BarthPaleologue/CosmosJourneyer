import { PlanetChunk } from "./planetChunk";

/**
 * The DeleteMutex is responsible to delete chunk only when replacements are created to avoid holes in the surface of planets
 * Each time a replacement chunk is set ready, we decrement the countdown. When it reaches 0 the old chunks can be deleted
 */
export class DeleteMutex {
    private flag: number;
    readonly chunksToDelete: PlanetChunk[];

    constructor(newChunks: PlanetChunk[], chunksToDelete: PlanetChunk[]) {
        this.flag = newChunks.length;
        this.chunksToDelete = chunksToDelete;

        for (const chunk of newChunks) {
            chunk.onRecieveVertexDataObservable.add(() => this.countdown());
        }
    }

    private countdown() {
        this.flag--;
        if (this.flag === 0) {
            for (const chunk of this.chunksToDelete) {
                chunk.dispose();
            }
        }
    }

    public isResolved() {
        return this.flag === 0;
    }
}
