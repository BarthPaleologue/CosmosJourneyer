import { z } from "zod";

import { SpaceDiscoveryDataSchema } from "@/backend/society/encyclopaediaGalactica";

import { SerializedComponentSchema } from "../frontend/spaceship/serializedComponents/component";
import { getDefaultSerializedSpaceship, SerializedSpaceshipSchema } from "../frontend/spaceship/serializedSpaceship";
import { MissionSerializedSchema } from "../missions/missionSerialized";
import { StarSystemCoordinatesSchema } from "../utils/coordinates/starSystemCoordinates";

export const CompletedTutorialsSchema = z.object({
    flightCompleted: z.boolean().default(false),
    stationLandingCompleted: z.boolean().default(false),
    starMapCompleted: z.boolean().default(false),
    fuelScoopingCompleted: z.boolean().default(false),
});

export type CompletedTutorials = z.infer<typeof CompletedTutorialsSchema>;

export const SerializedPlayerSchema = z.object({
    uuid: z
        .string()
        .uuid()
        .default(() => crypto.randomUUID()),
    name: z.string().default("Python"),
    balance: z.number().default(10000),
    creationDate: z.string().default(new Date().toISOString()),
    timePlayedSeconds: z.number().default(0),
    visitedSystemHistory: z.array(StarSystemCoordinatesSchema).default([]),
    discoveries: z
        .object({
            local: z.array(SpaceDiscoveryDataSchema).default([]),
            uploaded: z.array(SpaceDiscoveryDataSchema).default([]),
        })
        .default({
            local: [],
            uploaded: [],
        }),
    currentItinerary: z.array(StarSystemCoordinatesSchema).default([]),
    systemBookmarks: z.array(StarSystemCoordinatesSchema).default([]),
    currentMissions: z.array(MissionSerializedSchema).default([]),
    completedMissions: z.array(MissionSerializedSchema).default([]),
    spaceShips: z.array(SerializedSpaceshipSchema).default([getDefaultSerializedSpaceship()]),
    spareSpaceshipComponents: z.array(SerializedComponentSchema).default([]),
    tutorials: CompletedTutorialsSchema.default({
        flightCompleted: false,
        stationLandingCompleted: false,
        starMapCompleted: false,
        fuelScoopingCompleted: false,
    }),
});

export type SerializedPlayer = z.infer<typeof SerializedPlayerSchema>;
