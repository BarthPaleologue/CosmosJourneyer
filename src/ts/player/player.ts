import { Mission, MissionSerialized } from "../missions/mission";
import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { warnIfUndefined } from "../utils/notification";
import { DefaultSerializedSpaceship, SerializedSpaceship, Spaceship } from "../spaceship/spaceship";

export type SerializedPlayer = {
    name: string;
    balance: number;
    creationDate: string;

    visitedSystemHistory: StarSystemCoordinates[];

    currentItinerary: StarSystemCoordinates[];
    systemBookmarks: StarSystemCoordinates[];

    currentMissions: MissionSerialized[];
    completedMissions: MissionSerialized[];

    spaceShips: SerializedSpaceship[];
};

export class Player {
    name: string;
    balance: number;
    creationDate: Date;

    visitedSystemHistory: StarSystemCoordinates[] = [];

    currentItinerary: StarSystemCoordinates[];
    systemBookmarks: StarSystemCoordinates[];

    currentMissions: Mission[] = [];
    completedMissions: Mission[] = [];

    serializedSpaceships: SerializedSpaceship[] = [];
    instancedSpaceships: Spaceship[] = [];

    static DEFAULT_NAME = "Python";
    static DEFAULT_BALANCE = 10_000;

    private constructor(
        name: string,
        balance: number,
        creationDate: Date,
        visitedSystemHistory: StarSystemCoordinates[],
        currentItinerary: StarSystemCoordinates[],
        systemBookmarks: StarSystemCoordinates[],
        currentMissions: Mission[],
        completedMissions: Mission[],
        serializedSpaceships: SerializedSpaceship[]
    ) {
        this.name = name;
        this.balance = balance;
        this.creationDate = creationDate;
        this.visitedSystemHistory = visitedSystemHistory;
        this.currentItinerary = currentItinerary;
        this.systemBookmarks = systemBookmarks;
        this.currentMissions = currentMissions;
        this.completedMissions = completedMissions;
        this.serializedSpaceships = serializedSpaceships;
    }

    public static Default(): Player {
        return new Player(Player.DEFAULT_NAME, Player.DEFAULT_BALANCE, new Date(), [], [], [], [], [], [DefaultSerializedSpaceship]);
    }

    public static Deserialize(serializedPlayer: SerializedPlayer): Player {
        return new Player(
            warnIfUndefined(serializedPlayer.name, Player.DEFAULT_NAME, `[PLAYER_DATA_WARNING] Name was undefined. Defaulting to ${Player.DEFAULT_NAME}`),
            warnIfUndefined(serializedPlayer.balance, Player.DEFAULT_BALANCE, `[PLAYER_DATA_WARNING] Balance was undefined. Defaulting to ${Player.DEFAULT_BALANCE}`),
            new Date(warnIfUndefined(serializedPlayer.creationDate, new Date().toISOString(), `[PLAYER_DATA_WARNING] Creation date was undefined. Defaulting to current date`)),
            warnIfUndefined(serializedPlayer.visitedSystemHistory, [], `[PLAYER_DATA_WARNING] Visited system history was undefined. Defaulting to empty array`),
            warnIfUndefined(serializedPlayer.currentItinerary, [], `[PLAYER_DATA_WARNING] Current itinerary was undefined. Defaulting to empty array`),
            warnIfUndefined(serializedPlayer.systemBookmarks, [], `[PLAYER_DATA_WARNING] System bookmarks were undefined. Defaulting to empty array`),
            warnIfUndefined(serializedPlayer.currentMissions, [], `[PLAYER_DATA_WARNING] Current missions were undefined. Defaulting to empty array`).map((mission) =>
                Mission.Deserialize(mission)
            ),
            warnIfUndefined(serializedPlayer.completedMissions, [], `[PLAYER_DATA_WARNING] Completed missions were undefined. Defaulting to empty array`).map((mission) =>
                Mission.Deserialize(mission)
            ),
            warnIfUndefined(serializedPlayer.spaceShips, [DefaultSerializedSpaceship], `[PLAYER_DATA_WARNING] Spaceships were undefined. Defaulting to the default spaceship`)
        );
    }

    public static Serialize(player: Player): SerializedPlayer {
        return {
            name: player.name,
            balance: player.balance,
            creationDate: player.creationDate.toISOString(),
            visitedSystemHistory: player.visitedSystemHistory,
            currentItinerary: player.currentItinerary,
            systemBookmarks: player.systemBookmarks,
            currentMissions: player.currentMissions.map((mission) => mission.serialize()),
            completedMissions: player.completedMissions.map((mission) => mission.serialize()),
            spaceShips: player.serializedSpaceships.concat(player.instancedSpaceships.map((spaceship) => spaceship.serialize()))
        };
    }

    public copyFrom(player: Player) {
        this.name = player.name;
        this.balance = player.balance;
        this.creationDate = player.creationDate;
        this.visitedSystemHistory = player.visitedSystemHistory;
        this.currentItinerary = player.currentItinerary;
        this.systemBookmarks = player.systemBookmarks;
        this.currentMissions = player.currentMissions;
        this.completedMissions = player.completedMissions;
        this.serializedSpaceships = player.serializedSpaceships;
        this.instancedSpaceships = player.instancedSpaceships;
    }
}
