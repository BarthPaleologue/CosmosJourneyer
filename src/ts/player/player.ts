import { Mission, MissionSerialized } from "../missions/mission";
import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { warnIfUndefined } from "../utils/notification";
import { DefaultSerializedSpaceship, SerializedSpaceship, Spaceship } from "../spaceship/spaceship";

export type CompletedTutorials = {
    stationLandingCompleted: boolean;
};

export type SerializedPlayer = {
    uuid: string;

    name: string;

    balance: number;
    
    creationDate: string;

    timePlayedSeconds: number;

    visitedSystemHistory: StarSystemCoordinates[];

    currentItinerary: StarSystemCoordinates[];
    systemBookmarks: StarSystemCoordinates[];

    currentMissions: MissionSerialized[];
    completedMissions: MissionSerialized[];

    spaceShips: SerializedSpaceship[];

    tutorials: CompletedTutorials;
};

export class Player {
    uuid: string;
    name: string;
    balance: number;
    creationDate: Date;
    timePlayedSeconds: number;

    visitedSystemHistory: StarSystemCoordinates[] = [];

    currentItinerary: StarSystemCoordinates[];
    systemBookmarks: StarSystemCoordinates[];

    currentMissions: Mission[] = [];
    completedMissions: Mission[] = [];

    serializedSpaceships: SerializedSpaceship[] = [];
    instancedSpaceships: Spaceship[] = [];

    tutorials: CompletedTutorials;

    static DEFAULT_NAME = "Python";
    static DEFAULT_BALANCE = 10_000;

    private constructor(serializedPlayer: SerializedPlayer) {
        this.uuid = serializedPlayer.uuid;
        this.name = warnIfUndefined(serializedPlayer.name, Player.DEFAULT_NAME, `[PLAYER_DATA_WARNING] Name was undefined. Defaulting to ${Player.DEFAULT_NAME}`);
        this.balance = warnIfUndefined(serializedPlayer.balance, Player.DEFAULT_BALANCE, `[PLAYER_DATA_WARNING] Balance was undefined. Defaulting to ${Player.DEFAULT_BALANCE}`);
        this.creationDate = new Date(
            warnIfUndefined(serializedPlayer.creationDate, new Date().toISOString(), `[PLAYER_DATA_WARNING] Creation date was undefined. Defaulting to current date`)
        );
        this.timePlayedSeconds = warnIfUndefined(serializedPlayer.timePlayedSeconds, 0, `[PLAYER_DATA_WARNING] Time played was undefined. Defaulting to 0`);
        this.visitedSystemHistory = warnIfUndefined(
            serializedPlayer.visitedSystemHistory,
            [],
            `[PLAYER_DATA_WARNING] Visited system history was undefined. Defaulting to empty array`
        );
        this.currentItinerary = warnIfUndefined(serializedPlayer.currentItinerary, [], `[PLAYER_DATA_WARNING] Current itinerary was undefined. Defaulting to empty array`);
        this.systemBookmarks = warnIfUndefined(serializedPlayer.systemBookmarks, [], `[PLAYER_DATA_WARNING] System bookmarks were undefined. Defaulting to empty array`);
        this.currentMissions = warnIfUndefined(serializedPlayer.currentMissions, [], `[PLAYER_DATA_WARNING] Current missions were undefined. Defaulting to empty array`).map(
            (mission) => Mission.Deserialize(mission)
        );
        this.completedMissions = warnIfUndefined(serializedPlayer.completedMissions, [], `[PLAYER_DATA_WARNING] Completed missions were undefined. Defaulting to empty array`).map(
            (mission) => Mission.Deserialize(mission)
        );
        this.serializedSpaceships = warnIfUndefined(
            serializedPlayer.spaceShips,
            [DefaultSerializedSpaceship],
            `[PLAYER_DATA_WARNING] Spaceships were undefined. Defaulting to the default spaceship`
        );

        this.tutorials = warnIfUndefined(
            serializedPlayer.tutorials,
            { stationLandingCompleted: false },
            `[PLAYER_DATA_WARNING] Tutorials were undefined. Defaulting to no tutorials completed`
        );
    }

    public static Default(): Player {
        return new Player({
            uuid: crypto.randomUUID(),
            name: Player.DEFAULT_NAME,
            balance: Player.DEFAULT_BALANCE,
            creationDate: new Date().toISOString(),
            timePlayedSeconds: 0,
            visitedSystemHistory: [],
            currentItinerary: [],
            systemBookmarks: [],
            currentMissions: [],
            completedMissions: [],
            spaceShips: [DefaultSerializedSpaceship],
            tutorials: {
                stationLandingCompleted: false
            }
        });
    }

    public static Deserialize(serializedPlayer: SerializedPlayer): Player {
        return new Player(serializedPlayer);
    }

    public static Serialize(player: Player): SerializedPlayer {
        return {
            uuid: player.uuid,
            name: player.name,
            balance: player.balance,
            creationDate: player.creationDate.toISOString(),
            timePlayedSeconds: Math.round(player.timePlayedSeconds),
            visitedSystemHistory: player.visitedSystemHistory,
            currentItinerary: player.currentItinerary,
            systemBookmarks: player.systemBookmarks,
            currentMissions: player.currentMissions.map((mission) => mission.serialize()),
            completedMissions: player.completedMissions.map((mission) => mission.serialize()),
            spaceShips: player.serializedSpaceships.concat(player.instancedSpaceships.map((spaceship) => spaceship.serialize())),
            tutorials: player.tutorials
        };
    }

    /**
     * Performs a deep copy of the player
     * @param player the player to copy from
     */
    public copyFrom(player: Player) {
        const playerClone = structuredClone(player);
        this.uuid = playerClone.uuid;
        this.name = playerClone.name;
        this.balance = playerClone.balance;
        this.creationDate = playerClone.creationDate;
        this.timePlayedSeconds = playerClone.timePlayedSeconds;
        this.visitedSystemHistory = playerClone.visitedSystemHistory;
        this.currentItinerary = playerClone.currentItinerary;
        this.systemBookmarks = playerClone.systemBookmarks;
        this.currentMissions = playerClone.currentMissions;
        this.completedMissions = playerClone.completedMissions;
        this.serializedSpaceships = playerClone.serializedSpaceships;
        this.instancedSpaceships = playerClone.instancedSpaceships;
        this.tutorials = playerClone.tutorials;
    }
}
