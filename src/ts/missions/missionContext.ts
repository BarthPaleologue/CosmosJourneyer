import { StarSystemController } from "../starSystem/starSystemController";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";

/**
 * Describes information used by mission nodes to update their state
 */
export type MissionContext = {
    /**
     * The current star system the player is in
     */
    currentSystem: StarSystemController;
    /**
     * The world position of the player
     */
    playerPosition: Vector3;
    /**
     * Reference to the physics engine for ray/shape casting
     */
    physicsEngine: PhysicsEngineV2;
};
