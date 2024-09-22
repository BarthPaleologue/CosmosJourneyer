import { StarSystemController } from "../starSystem/starSystemController";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";

export type MissionContext = {
    currentSystem: StarSystemController;
    playerPosition: Vector3;
    physicsEngine: PhysicsEngineV2;
};
