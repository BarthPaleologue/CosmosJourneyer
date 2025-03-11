import { z } from "zod";
import { MissionSerializedSchema } from "../missions/missionSerialized";
import { SpaceDiscoveryDataSchema } from "../society/encyclopaediaGalactica";
import { SerializedSpaceshipSchema, DefaultSerializedSpaceship } from "../spaceship/serializedSpaceship";
import { StarSystemCoordinatesSchema } from "../utils/coordinates/universeCoordinates";

export const CompletedTutorialsSchema = z.object({
    stationLandingCompleted: z.boolean().default(false),
    fuelScoopingCompleted: z.boolean().default(false)
});

export type CompletedTutorials = z.infer<typeof CompletedTutorialsSchema>;

export const SerializedPlayerSchema = z.object({
    uuid: z.string().default(() => crypto.randomUUID()),
    name: z.string().default("Python"),
    balance: z.number().default(10000),
    creationDate: z.string().default(new Date().toISOString()),
    timePlayedSeconds: z.number().default(0),
    visitedSystemHistory: z.array(StarSystemCoordinatesSchema).default([]),
    discoveries: z
        .object({
            local: z.array(SpaceDiscoveryDataSchema).default([]),
            uploaded: z.array(SpaceDiscoveryDataSchema).default([])
        })
        .default({
            local: [],
            uploaded: []
        }),
    currentItinerary: z.array(StarSystemCoordinatesSchema).default([]),
    systemBookmarks: z.array(StarSystemCoordinatesSchema).default([]),
    currentMissions: z.array(MissionSerializedSchema).default([]),
    completedMissions: z.array(MissionSerializedSchema).default([]),
    spaceShips: z.array(SerializedSpaceshipSchema).default([DefaultSerializedSpaceship]),
    tutorials: CompletedTutorialsSchema.default({
        stationLandingCompleted: false,
        fuelScoopingCompleted: false
    })
});

export type SerializedPlayer = z.infer<typeof SerializedPlayerSchema>;
