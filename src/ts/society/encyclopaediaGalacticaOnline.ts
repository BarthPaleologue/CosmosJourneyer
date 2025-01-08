import { UniverseObjectId } from "../utils/coordinates/universeCoordinates";
import { EncyclopaediaGalactica, SpaceDiscoveryData } from "./encyclopaediaGalactica";

export class EncyclopaediaGalacticaOnline implements EncyclopaediaGalactica {
    readonly base: URL;

    readonly loginEndPoint: URL;
    readonly contributeDiscoveryIfNewEndPoint: URL;
    readonly contributeDiscoveryEndPoint: URL;
    readonly hasObjectBeenDiscoveredEndPoint: URL;
    readonly estimateDiscoveryEndPoint: URL;

    constructor(baseUrl: URL, accountId: string, password: string) {
        this.base = baseUrl;

        this.loginEndPoint = new URL("login", this.base);
        this.contributeDiscoveryIfNewEndPoint = new URL("contributeDiscoveryIfNew", this.base);
        this.contributeDiscoveryEndPoint = new URL("contributeDiscovery", this.base);
        this.hasObjectBeenDiscoveredEndPoint = new URL("hasObjectBeenDiscovered", this.base);
        this.estimateDiscoveryEndPoint = new URL("estimateDiscovery", this.base);

        // connect to the server
        fetch(this.loginEndPoint, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify({
                accountId: accountId,
                password: password
            })
        });
    }

    async contributeDiscoveryIfNew(data: SpaceDiscoveryData): Promise<boolean> {
        const result = await fetch(this.contributeDiscoveryIfNewEndPoint, {
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
        const result = await fetch(this.hasObjectBeenDiscoveredEndPoint, {
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
        const result = await fetch(this.estimateDiscoveryEndPoint, {
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

    public getBackendString(): string {
        return this.base.toString();
    }
}
