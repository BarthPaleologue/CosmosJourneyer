import { SystemSeed } from "../utils/systemSeed";
import { getStarGalacticCoordinates } from "../utils/getStarGalacticCoordinates";
import { Settings } from "../settings";

export function isSystemInHumanBubble(systemSeed: SystemSeed) {
    const systemPosition = getStarGalacticCoordinates(systemSeed);
    const distanceToSolLy = systemPosition.length();

    return distanceToSolLy < Settings.HUMAN_BUBBLE_RADIUS_LY;
}