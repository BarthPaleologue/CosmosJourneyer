import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import i18n from "../i18n";
import { StarSystemCoordinates, starSystemCoordinatesEquals } from "../utils/coordinates/universeCoordinates";
import { parseDistance } from "../utils/strings/parseToStrings";
import { MissionContext } from "./missionContext";
import { getStarGalacticPosition } from "../utils/coordinates/starSystemCoordinatesUtils";
import { Settings } from "../settings";
import { GeneralInputs } from "../inputs/generalInputs";
import { pressInteractionToStrings } from "../utils/strings/inputControlsString";
import { getSystemModelFromCoordinates } from "../starSystem/modelFromCoordinates";

export function getGoToSystemInstructions(missionContext: MissionContext, targetSystemCoordinates: StarSystemCoordinates, keyboardLayout: Map<string, string>): string {
    const currentPlayerDestination = missionContext.currentItinerary.at(-1);
    const isPlayerGoingToTargetSystem = currentPlayerDestination !== undefined && starSystemCoordinatesEquals(currentPlayerDestination, targetSystemCoordinates);

    const currentSystemPosition = getStarGalacticPosition(missionContext.currentSystem.model.coordinates);

    if (!isPlayerGoingToTargetSystem) {
        return i18n.t("missions:common:openStarMap", {
            starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(` ${i18n.t("common:or")} `)
        });
    } else {
        const nextSystemCoordinates = missionContext.currentItinerary[1];
        const nextSystemModel = nextSystemCoordinates !== undefined ? getSystemModelFromCoordinates(nextSystemCoordinates) : undefined;
        if (nextSystemModel === undefined) {
            throw new Error("Next system model in itinerary is undefined and yet the player has an itinerary to the target system?!");
        }

        const distanceToNextSystem = Vector3.Distance(getStarGalacticPosition(nextSystemModel.coordinates), currentSystemPosition);

        return i18n.t("missions:common:travelToNextSystem", {
            systemName: nextSystemModel.name,
            distance: parseDistance(distanceToNextSystem * Settings.LIGHT_YEAR),
            nbJumps: missionContext.currentItinerary.length - 1
        });
    }
}
