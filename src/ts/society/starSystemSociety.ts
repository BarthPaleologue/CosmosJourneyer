import { getStarGalacticPosition } from "../utils/getStarGalacticPositionFromSeed";
import { Settings } from "../settings";
import { StarSystemCoordinates } from "../starSystem/starSystemModel";

export function isSystemInHumanBubble(systemCoordinates: StarSystemCoordinates) {
    const systemPosition = getStarGalacticPosition(systemCoordinates);
    const distanceToSolLy = systemPosition.length();

    return distanceToSolLy < Settings.HUMAN_BUBBLE_RADIUS_LY;
}
