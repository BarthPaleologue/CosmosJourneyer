import { UniverseObjectId } from "../utils/coordinates/universeCoordinates";
import { EncyclopaediaGalactica, SpaceDiscoveryData } from "./encyclopaediaGalactica";

export class EncyclopaediaGalacticaManager implements EncyclopaediaGalactica {
    readonly backends: EncyclopaediaGalactica[] = [];

    public async contributeDiscoveryIfNew(data: SpaceDiscoveryData): Promise<boolean> {
        let hasBeenContributed = false;
        for (const backend of this.backends) {
            hasBeenContributed = hasBeenContributed || (await backend.contributeDiscoveryIfNew(data));
        }

        return hasBeenContributed;
    }

    public async hasObjectBeenDiscovered(objectId: UniverseObjectId): Promise<boolean> {
        for (const backend of this.backends) {
            if (await backend.hasObjectBeenDiscovered(objectId)) {
                return true;
            }
        }

        return false;
    }

    public async estimateDiscovery(object: UniverseObjectId): Promise<number> {
        let sum = 0;
        for (const backend of this.backends) {
            sum += await backend.estimateDiscovery(object);
        }

        return Promise.resolve(sum);
    }

    public getBackendString(): string {
        return this.backends.map((backend) => backend.getBackendString()).join(", ");
    }
}
