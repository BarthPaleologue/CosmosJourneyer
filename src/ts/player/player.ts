import { Mission, MissionSerialized } from "../missions/mission";
import { StarSystemCoordinates } from "../starSystem/starSystemModel";

export type SerializedPlayer = {
    name: string;
    balance: number;
    creationDate: string;
    currentItinerary: StarSystemCoordinates[];
    systemBookmarks: StarSystemCoordinates[];

    currentMissions: MissionSerialized[];
    completedMissions: MissionSerialized[];
};

export class Player {
    name: string;
    balance: number;
    creationDate: Date;

    currentItinerary: StarSystemCoordinates[];
    systemBookmarks: StarSystemCoordinates[];

    currentMissions: Mission[] = [];
    completedMissions: Mission[] = [];

    private constructor(
        name: string,
        balance: number,
        creationDate: Date,
        currentItinerary: StarSystemCoordinates[],
        systemBookmarks: StarSystemCoordinates[],
        currentMissions: Mission[],
        completedMissions: Mission[]
    ) {
        this.name = name;
        this.balance = balance;
        this.creationDate = creationDate;
        this.currentItinerary = currentItinerary;
        this.systemBookmarks = systemBookmarks;
        this.currentMissions = currentMissions;
        this.completedMissions = completedMissions;
    }

    public static Default(): Player {
        return new Player("Python", 10_000, new Date(), [], [], [], []);
    }

    public static Deserialize(serializedPlayer: SerializedPlayer): Player {
        return new Player(
            serializedPlayer.name,
            serializedPlayer.balance,
            new Date(serializedPlayer.creationDate),
            serializedPlayer.currentItinerary,
            serializedPlayer.systemBookmarks,
            serializedPlayer.currentMissions.map((mission) => Mission.Deserialize(mission)),
            serializedPlayer.completedMissions.map((mission) => Mission.Deserialize(mission))
        );
    }

    public static Serialize(player: Player): SerializedPlayer {
        return {
            name: player.name,
            balance: player.balance,
            creationDate: player.creationDate.toISOString(),
            currentItinerary: player.currentItinerary,
            systemBookmarks: player.systemBookmarks,
            currentMissions: player.currentMissions.map((mission) => mission.serialize()),
            completedMissions: player.completedMissions.map((mission) => mission.serialize())
        };
    }

    public copyFrom(player: Player) {
        this.name = player.name;
        this.balance = player.balance;
        this.creationDate = player.creationDate;
        this.currentItinerary = player.currentItinerary;
        this.systemBookmarks = player.systemBookmarks;
        this.currentMissions = player.currentMissions;
        this.completedMissions = player.completedMissions;
    }
}
