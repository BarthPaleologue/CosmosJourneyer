import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import i18n from "../i18n";
import { StarSystemCoordinates, starSystemCoordinatesEquals } from "../utils/coordinates/starSystemCoordinates";
import { parseDistance } from "../utils/strings/parseToStrings";
import { MissionContext } from "./missionContext";
import { Settings } from "../settings";
import { GeneralInputs } from "../inputs/generalInputs";
import { pressInteractionToStrings } from "../utils/strings/inputControlsString";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";

export function getGoToSystemInstructions(
    missionContext: MissionContext,
    targetSystemCoordinates: StarSystemCoordinates,
    keyboardLayout: Map<string, string>,
    starSystemDatabase: StarSystemDatabase
): string {
    const currentPlayerDestination = missionContext.currentItinerary.at(-1);
    const isPlayerGoingToTargetSystem =
        currentPlayerDestination !== undefined &&
        starSystemCoordinatesEquals(currentPlayerDestination, targetSystemCoordinates);

    const currentSystemPosition = starSystemDatabase.getSystemGalacticPosition(
        missionContext.currentSystem.model.coordinates
    );

    if (!isPlayerGoingToTargetSystem) {
        return i18n.t("missions:common:openStarMap", {
            starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(
                ` ${i18n.t("common:or")} `
            )
        });
    } else {
        const nextSystemCoordinates = missionContext.currentItinerary.at(1);
        const nextSystemModel =
            nextSystemCoordinates !== undefined
                ? starSystemDatabase.getSystemModelFromCoordinates(nextSystemCoordinates)
                : null;
        if (nextSystemModel === null) {
            throw new Error(
                "Next system model in itinerary is null and yet the player has an itinerary to the target system?!"
            );
        }

        const distanceToNextSystem = Vector3.Distance(
            starSystemDatabase.getSystemGalacticPosition(nextSystemModel.coordinates),
            currentSystemPosition
        );

        return i18n.t("missions:common:travelToNextSystem", {
            systemName: nextSystemModel.name,
            distance: parseDistance(distanceToNextSystem * Settings.LIGHT_YEAR),
            nbJumps: missionContext.currentItinerary.length - 1
        });
    }
}
