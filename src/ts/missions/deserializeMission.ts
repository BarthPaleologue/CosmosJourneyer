import { Mission, MissionSerialized } from "./mission";
import { getObjectModelByUniverseId } from "../utils/orbitalObjectId";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { deserializeMissionNode } from "./nodes/deserializeNode";

export function deserializeMission(missionSerialized: MissionSerialized) {

    return new Mission(
        deserializeMissionNode(missionSerialized.tree),
        missionSerialized.reward,
        getObjectModelByUniverseId(missionSerialized.missionGiver) as SpaceStationModel,
        missionSerialized.type
    );
}