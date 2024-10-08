import { MissionSerialized, MissionType } from "./mission";
import { SightSeeingMission, SightSeeingMissionSerialized } from "./sightSeeingMission";
import { getObjectModelByUniverseId } from "../utils/orbitalObjectId";
import { SpaceStationModel } from "../spacestation/spacestationModel";

export function deserializeMission(missionSerialized: MissionSerialized) {
    switch (missionSerialized.type) {
        case MissionType.SIGHT_SEEING:
            return deserializeSightSeeingMission(missionSerialized as SightSeeingMissionSerialized);
        default:
            throw new Error(`Unknown mission type: ${missionSerialized.type}`);
    }
}

function deserializeSightSeeingMission(missionSerialized: SightSeeingMissionSerialized) {
    const missionGiver = getObjectModelByUniverseId(missionSerialized.missionGiver);
    if (!(missionGiver instanceof SpaceStationModel)) {
        throw new Error("Mission giver is not a space station model");
    }
    return new SightSeeingMission(missionGiver, missionSerialized.target);
}
