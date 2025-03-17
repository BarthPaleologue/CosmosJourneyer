import { safeParseSave } from "../saveFileData";
import { expect, test } from "vitest";
import { SaveV2 } from "./saveV2";
import { DeepPartial } from "../../utils/types";
import { getLoneStarSystem } from "../../starSystem/customSystems/loneStar";
import { StarSystemDatabase } from "../../starSystem/starSystemDatabase";

test("Loading a correct save file", () => {
    const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
    const shipId = crypto.randomUUID();
    const saveFileString: DeepPartial<SaveV2> = {
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
                    localZ: -0.20050806724490045
                }
            ],
            currentItinerary: [
                {
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 0,
                    localX: -0.3993145315439042,
                    localY: -0.17682292017937773,
                    localZ: -0.2643619085496114
                },
                {
                    starSectorX: -1,
                    starSectorY: -1,
                    starSectorZ: 0,
                    localX: 0.1546895195053376,
                    localY: 0.4998550098388712,
                    localZ: 0.10347912209270482
                },
                {
                    starSectorX: -1,
                    starSectorY: -1,
                    starSectorZ: 0,
                    localX: -0.09519642898589209,
                    localY: 0.45472296232111886,
                    localZ: 0.026533731970253327
                },
                {
                    starSectorX: -2,
                    starSectorY: -1,
                    starSectorZ: 0,
                    localX: 0.2630095518021889,
                    localY: 0.4245715527444014,
                    localZ: 0.22796505444122717
                },
                {
                    starSectorX: -2,
                    starSectorY: -1,
                    starSectorZ: 0,
                    localX: -0.09328404096573778,
                    localY: 0.48089380468283494,
                    localZ: 0.3811143165831986
                },
                {
                    starSectorX: -3,
                    starSectorY: -1,
                    starSectorZ: 0,
                    localX: 0.2960593378152975,
                    localY: 0.2122889010758553,
                    localZ: 0.45815722456116104
                }
            ],
            systemBookmarks: [],
            currentMissions: [
                {
                    missionGiver: {
                        idInSystem: starSystemDatabase.fallbackSystem.orbitalFacilities[0].id,
                        systemCoordinates: {
                            starSectorX: 0,
                            starSectorY: 0,
                            starSectorZ: 0,
                            localX: -0.1980424619736348,
                            localY: -0.11183447093322618,
                            localZ: -0.20050806724490045
                        }
                    },
                    tree: {
                        type: 0,
                        objectId: {
                            idInSystem: starSystemDatabase.fallbackSystem.stellarObjects[0].id,
                            systemCoordinates: {
                                starSectorX: -3,
                                starSectorY: -1,
                                starSectorZ: 0,
                                localX: 0.2960593378152975,
                                localY: 0.2122889010758553,
                                localZ: 0.45815722456116104
                            }
                        },
                        state: 0
                    },
                    reward: 81000,
                    type: 0
                }
            ],
            completedMissions: []
        },
        playerLocation: {
            type: "inSpaceship",
            shipId: shipId
        },
        shipLocations: {
            [shipId]: {
                type: "relative",
                universeObjectId: {
                    idInSystem: starSystemDatabase.fallbackSystem.stellarObjects[0].id,
                    systemCoordinates: starSystemDatabase.fallbackSystem.coordinates
                },
                position: {
                    x: -0.3993145315439042,
                    y: -0.17682292017937773,
                    z: -0.2643619085496114
                },
                rotation: {
                    x: 0.8044142851159338,
                    y: 0.5176010021718461,
                    z: 0.13137419708191372,
                    w: 0.26028384972653257
                }
            }
        }
    };

    const parsedSaveFile = safeParseSave(saveFileString, starSystemDatabase);
    expect(parsedSaveFile.success).toBe(true);
});

test("Loading a minimal save file", () => {
    const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
    const shipId = crypto.randomUUID();
    const saveFileString: DeepPartial<SaveV2> = {
        player: {
            name: "Python",
            balance: 10000,
            creationDate: "2024-11-03T17:04:46.662Z",
            visitedSystemHistory: [],
            currentItinerary: [],
            systemBookmarks: [],
            currentMissions: [],
            completedMissions: []
        },
        playerLocation: {
            type: "inSpaceship",
            shipId: shipId
        },
        shipLocations: {
            [shipId]: {
                type: "relative",
                universeObjectId: {
                    idInSystem: starSystemDatabase.fallbackSystem.stellarObjects[0].id,
                    systemCoordinates: starSystemDatabase.fallbackSystem.coordinates
                },
                position: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                rotation: {
                    x: 0.8044142851159338,
                    y: 0.5176010021718461,
                    z: 0.13137419708191372,
                    w: 0.26028384972653257
                }
            }
        }
    };

    const parsedSaveFile = safeParseSave(saveFileString, starSystemDatabase);
    if (!parsedSaveFile.success) {
        console.log(parsedSaveFile.error);
    }

    expect(parsedSaveFile.success).toBe(true);
});
