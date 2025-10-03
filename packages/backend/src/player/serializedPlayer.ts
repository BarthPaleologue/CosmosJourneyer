import { SpaceDiscoveryDataSchema } from "@cosmos-journeyer/backend/encyclopaedia/encyclopaediaGalactica";
import { MissionSerializedSchema } from "@cosmos-journeyer/backend/missions/missionSerialized";
import { SerializedComponentSchema } from "@cosmos-journeyer/backend/spaceship/serializedComponents/component";
import {
    getDefaultSerializedSpaceship,
    SerializedSpaceshipSchema,
} from "@cosmos-journeyer/backend/spaceship/serializedSpaceship";
import { StarSystemCoordinatesSchema } from "@cosmos-journeyer/backend/universe/starSystemCoordinates";
import { z } from "zod";

export const CompletedTutorialsSchema = z.object({
    flightCompleted: z.boolean().default(false),
    stationLandingCompleted: z.boolean().default(false),
    starMapCompleted: z.boolean().default(false),
    fuelScoopingCompleted: z.boolean().default(false),
});

export type CompletedTutorials = z.infer<typeof CompletedTutorialsSchema>;

export const ItinerarySchema = z
    .tuple([StarSystemCoordinatesSchema, StarSystemCoordinatesSchema])
    .rest(StarSystemCoordinatesSchema);

export type Itinerary = z.infer<typeof ItinerarySchema>;

export const SerializedPlayerSchema = z.object({
    uuid: z
        .string()
        .uuid()
        .default(() => crypto.randomUUID()),
    name: z.string().default("Python"),
    balance: z.number().default(10000),
    creationDate: z.string().default(() => new Date().toISOString()),
    timePlayedSeconds: z.number().default(0),
    visitedSystemHistory: z.array(StarSystemCoordinatesSchema).default(() => []),
    discoveries: z
        .object({
            local: z.array(SpaceDiscoveryDataSchema).default(() => []),
            uploaded: z.array(SpaceDiscoveryDataSchema).default(() => []),
        })
        .default(() => ({
            local: [],
            uploaded: [],
        })),
    currentItinerary: ItinerarySchema.nullable().catch(null),
    systemBookmarks: z.array(StarSystemCoordinatesSchema).default(() => []),
    currentMissions: z.array(MissionSerializedSchema).default(() => []),
    completedMissions: z.array(MissionSerializedSchema).default(() => []),
    spaceShips: z.array(SerializedSpaceshipSchema).default(() => [getDefaultSerializedSpaceship()]),
    spareSpaceshipComponents: z.array(SerializedComponentSchema).default(() => []),
    tutorials: CompletedTutorialsSchema.default(() => ({
        flightCompleted: false,
        stationLandingCompleted: false,
        starMapCompleted: false,
        fuelScoopingCompleted: false,
    })),
});

export type SerializedPlayer = z.infer<typeof SerializedPlayerSchema>;
