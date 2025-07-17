import { type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { ok, type Result } from "@/utils/types";

import { type EncyclopaediaGalactica, type SpaceDiscoveryData } from "./encyclopaediaGalactica";

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

    public async estimateDiscovery(object: UniverseObjectId): Promise<Result<number, string>> {
        let sum = 0;
        for (const backend of this.backends) {
            const result = await backend.estimateDiscovery(object);
            if (!result.success) {
                return result;
            }

            sum += result.value;
        }

        return ok(sum);
    }

    public getBackendString(): string {
        return this.backends.map((backend) => backend.getBackendString()).join(", ");
    }
}
