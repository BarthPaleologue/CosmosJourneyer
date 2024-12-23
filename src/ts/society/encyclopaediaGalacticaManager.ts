import { UniverseObjectId } from "../utils/coordinates/universeCoordinates";
import { EncyclopaediaGalactica, SpaceDiscoveryData } from "./encyclopaediaGalactica";

export class EncyclopaediaGalacticaManager implements EncyclopaediaGalactica {
    readonly backends: EncyclopaediaGalactica[] = [];

    public async contributeDiscoveryIfNew(data: SpaceDiscoveryData): Promise<boolean> {
        return this.backends.every(async (backend) => await backend.contributeDiscoveryIfNew(data));
    }

    public async hasObjectBeenDiscovered(objectId: UniverseObjectId): Promise<boolean> {
        return await this.backends.every(async (backend) => await backend.hasObjectBeenDiscovered(objectId));
    }

    public estimateDiscovery(object: UniverseObjectId): Promise<number> {
        let sum = 0;
        this.backends.forEach(async (backend) => {
            sum += await backend.estimateDiscovery(object);
        });

        return Promise.resolve(sum);
    }
}
