import { PlanetChunk } from "./planetChunk";

/**
 * The DeleteSemaphore is responsible to delete chunk only when replacements are created to avoid holes in the surface of planets
 * Each time a replacement chunk is set ready, we decrement the countdown. When it reaches 0 the old chunks can be deleted
 */
export class DeleteSemaphore {
    private flag: number;
    readonly chunksToDelete: PlanetChunk[];
    readonly newChunks: PlanetChunk[];

    constructor(newChunks: PlanetChunk[], chunksToDelete: PlanetChunk[]) {
        this.flag = newChunks.length;
        this.newChunks = newChunks;
        this.chunksToDelete = chunksToDelete;

        for (const chunk of newChunks) {
            chunk.onRecieveVertexDataObservable.add(() => this.countdown());
        }
    }

    private countdown() {
        this.flag--;
        if (this.flag === 0) {
            this.resolve();
        }
    }

    private resolve() {
        for (const chunk of this.chunksToDelete) {
            chunk.dispose();
        }
    }

    /**
     * Checks if the semaphore is a zombie (it can't be resolved anymore).
     * This happens when one of the new chunks has been disposed before receiving its vertex data.
     * If this is the case, we resolve the mutex immediately
     */
    public resolveIfZombie() {
        let anyNewChunkDisposed = false;
        for (const chunk of this.newChunks) {
            if (chunk.hasBeenDisposed()) {
                anyNewChunkDisposed = true;
                break;
            }
        }
        if(!anyNewChunkDisposed) return;

        this.flag = 0;
        this.resolve();
    }

    public isResolved() {
        return this.flag === 0;
    }
}
