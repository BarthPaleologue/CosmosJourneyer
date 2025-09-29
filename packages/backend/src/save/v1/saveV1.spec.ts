import { expect, test } from "vitest";

import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { type DeepPartial } from "@/utils/types";

import { safeParseSave } from "../saveFileData";
import { type SaveV1 } from "./saveV1";

test("Loading a correct save file", () => {
    const saveFileString: DeepPartial<SaveV1> = {
        version: "1.9.0",
        player: {
            name: "Python",
            balance: 10000,
            creationDate: "2024-11-03T17:04:46.662Z",
            visitedSystemHistory: [
                {
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 0,
                    localX: -0.1980424619736348,
                    localY: -0.11183447093322618,
                    localZ: -0.20050806724490045,
                },
            ],
            currentItinerary: [
                {
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 0,
                    localX: -0.3993145315439042,
                    localY: -0.17682292017937773,
                    localZ: -0.2643619085496114,
                },
                {
                    starSectorX: -1,
                    starSectorY: -1,
                    starSectorZ: 0,
                    localX: 0.1546895195053376,
                    localY: 0.4998550098388712,
                    localZ: 0.10347912209270482,
                },
                {
                    starSectorX: -1,
                    starSectorY: -1,
                    starSectorZ: 0,
                    localX: -0.09519642898589209,
                    localY: 0.45472296232111886,
                    localZ: 0.026533731970253327,
                },
                {
                    starSectorX: -2,
                    starSectorY: -1,
                    starSectorZ: 0,
                    localX: 0.2630095518021889,
                    localY: 0.4245715527444014,
                    localZ: 0.22796505444122717,
                },
                {
                    starSectorX: -2,
                    starSectorY: -1,
                    starSectorZ: 0,
                    localX: -0.09328404096573778,
                    localY: 0.48089380468283494,
                    localZ: 0.3811143165831986,
                },
                {
                    starSectorX: -3,
                    starSectorY: -1,
                    starSectorZ: 0,
                    localX: 0.2960593378152975,
                    localY: 0.2122889010758553,
                    localZ: 0.45815722456116104,
                },
            ],
            systemBookmarks: [],
            currentMissions: [
                {
                    missionGiver: {
                        objectType: 3,
                        objectIndex: 0,
                        systemCoordinates: {
                            starSectorX: 0,
                            starSectorY: 0,
                            starSectorZ: 0,
                            localX: -0.1980424619736348,
                            localY: -0.11183447093322618,
                            localZ: -0.20050806724490045,
                        },
                    },
                    tree: {
                        type: 0,
                        objectId: {
                            systemCoordinates: {
                                starSectorX: -3,
                                starSectorY: -1,
                                starSectorZ: 0,
                                localX: 0.2960593378152975,
                                localY: 0.2122889010758553,
                                localZ: 0.45815722456116104,
                            },
                            objectType: 0,
                            objectIndex: 0,
                        },
                        state: 0,
                    },
                    reward: 81000,
                    type: 0,
                },
            ],
            completedMissions: [],
        },
        universeCoordinates: {
            universeObjectId: {
                objectType: 0,
                objectIndex: 0,
                starSystemCoordinates: {
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 0,
                    localX: -0.3993145315439042,
                    localY: -0.17682292017937773,
                    localZ: -0.2643619085496114,
                },
            },
            positionX: 357165657.95592666,
            positionY: 115315171.0305462,
            positionZ: 113409128.52473554,
            rotationQuaternionX: 0.8044142851159338,
            rotationQuaternionY: 0.5176010021718461,
            rotationQuaternionZ: 0.13137419708191372,
            rotationQuaternionW: 0.26028384972653257,
        },
    };

    const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
    const parsedSaveFile = safeParseSave(saveFileString, starSystemDatabase);
    expect(parsedSaveFile.success).toBe(true);
});

test("Loading a minimal save file", () => {
    const saveFileString: DeepPartial<SaveV1> = {
        version: "1.9.0",
        player: {
            name: "Python",
            balance: 10000,
            creationDate: "2024-11-03T17:04:46.662Z",
            visitedSystemHistory: [],
            currentItinerary: [],
            systemBookmarks: [],
            currentMissions: [],
            completedMissions: [],
        },
        universeCoordinates: {
            universeObjectId: {
                objectType: 0,
                objectIndex: 0,
                starSystemCoordinates: {
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 0,
                    localX: -0.3993145315439042,
                    localY: -0.17682292017937773,
                    localZ: -0.2643619085496114,
                },
            },
            positionX: 357165657.95592666,
            positionY: 115315171.0305462,
            positionZ: 113409128.52473554,
            rotationQuaternionX: 0.8044142851159338,
            rotationQuaternionY: 0.5176010021718461,
            rotationQuaternionZ: 0.13137419708191372,
            rotationQuaternionW: 0.26028384972653257,
        },
    };

    const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
    const parsedSaveFile = safeParseSave(saveFileString, starSystemDatabase);
    expect(parsedSaveFile.success).toBe(true);
});
