import { UniverseObjectId } from "../utils/coordinates/universeCoordinates";
import { EncyclopaediaGalactica, SpaceDiscoveryData } from "./encyclopaediaGalactica";

export class EncyclopaediaGalacticaOnline implements EncyclopaediaGalactica {
    readonly endPointUrl: string;

    constructor(endPointUrl: string) {
        this.endPointUrl = endPointUrl;
    }

    async contributeDiscoveryIfNew(data: SpaceDiscoveryData): Promise<boolean> {
        const result = await fetch(this.endPointUrl, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify(data)
        });

        const parsedResult = await result.json();

        return parsedResult.wasNew;
    }

    async hasObjectBeenDiscovered(objectId: UniverseObjectId): Promise<boolean> {
        const result = await fetch(this.endPointUrl, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify(objectId)
        });

        const parsedResult = await result.json();

        return parsedResult.hasBeenDiscovered;
    }

    async estimateDiscovery(object: UniverseObjectId): Promise<number> {
        const result = await fetch(this.endPointUrl, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify(object)
        });

        const parsedResult = await result.json();

        return parsedResult.estimatedValue;
    }
}
