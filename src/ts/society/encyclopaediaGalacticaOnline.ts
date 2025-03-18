import { UniverseObjectId } from "../utils/coordinates/universeObjectId";
import { err, ok, Result } from "../utils/types";
import { EncyclopaediaGalactica, SpaceDiscoveryData } from "./encyclopaediaGalactica";
import { z } from "zod";

const estimateDiscoverySchema = z.object({
    estimatedValue: z.number()
});

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
        void fetch(this.loginEndPoint, {
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

    async estimateDiscovery(object: UniverseObjectId): Promise<Result<number, string>> {
        try {
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

            const parsedResult = estimateDiscoverySchema.safeParse(await result.json());
            if (!parsedResult.success) {
                return err(parsedResult.error.message);
            }

            return ok(parsedResult.data.estimatedValue);
        } catch (e) {
            console.error(e);
            return err(`${e}`);
        }
    }

    public getBackendString(): string {
        return this.base.toString();
    }
}
