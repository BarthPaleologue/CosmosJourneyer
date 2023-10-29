import { PlanetChunk } from "./planetChunk";

export class DeleteMutex {
    private flag: number;
    readonly chunksToDelete: PlanetChunk[];

    constructor(countdown: number, chunksToDelete: PlanetChunk[]) {
        this.flag = countdown;
        this.chunksToDelete = chunksToDelete;
    }

    public countdown() {
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
