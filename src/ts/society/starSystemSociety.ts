import { getStarGalacticPosition } from "../utils/coordinates/starSystemCoordinatesUtils";
import { Settings } from "../settings";

import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";

export function isSystemInHumanBubble(systemCoordinates: StarSystemCoordinates) {
    const systemPosition = getStarGalacticPosition(systemCoordinates);
    const distanceToSolLy = systemPosition.length();

    return distanceToSolLy < Settings.HUMAN_BUBBLE_RADIUS_LY;
}
