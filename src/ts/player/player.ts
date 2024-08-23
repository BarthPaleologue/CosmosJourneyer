import { SystemSeed, SystemSeedSerialized } from "../utils/systemSeed";

export type SerializedPlayer = {
    name: string;
    balance: number;
    creationDate: string;
    currentItinerary: SystemSeedSerialized[];
    systemBookmarks: SystemSeedSerialized[];
};

export class Player {
    name: string;
    balance: number;
    creationDate: Date;

    currentItinerary: SystemSeed[];
    systemBookmarks: SystemSeed[];

    private constructor(name: string, balance: number, creationDate: Date, currentItinerary: SystemSeed[], systemBookmarks: SystemSeed[]) {
        this.name = name;
        this.balance = balance;
        this.creationDate = creationDate;
        this.currentItinerary = currentItinerary;
        this.systemBookmarks = systemBookmarks;
    }

    public static Default(): Player {
        return new Player("Python", 10_000, new Date(), [], []);
    }

    public static Deserialize(serializedPlayer: SerializedPlayer): Player {
        return new Player(
            serializedPlayer.name,
            serializedPlayer.balance,
            new Date(serializedPlayer.creationDate),
            serializedPlayer.currentItinerary.map((seed) => SystemSeed.Deserialize(seed)),
            serializedPlayer.systemBookmarks.map((seed) => SystemSeed.Deserialize(seed))
        );
    }

    public static Serialize(player: Player): SerializedPlayer {
        return {
            name: player.name,
            balance: player.balance,
            creationDate: player.creationDate.toISOString(),
            currentItinerary: player.currentItinerary.map((seed) => seed.serialize()),
            systemBookmarks: player.systemBookmarks.map((seed) => seed.serialize())
        };
    }
}
