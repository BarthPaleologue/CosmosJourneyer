import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { StarSystemCoordinates, starSystemCoordinatesEquals } from "@/backend/universe/starSystemCoordinates";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { GeneralInputs } from "@/frontend/inputs/generalInputs";

import { lightYearsToMeters } from "@/utils/physics/unitConversions";
import { pressInteractionToStrings } from "@/utils/strings/inputControlsString";
import { parseDistance } from "@/utils/strings/parseToStrings";

import i18n from "@/i18n";

import { MissionContext } from "./missionContext";

export function getGoToSystemInstructions(
    missionContext: MissionContext,
    targetSystemCoordinates: StarSystemCoordinates,
    keyboardLayout: Map<string, string>,
    starSystemDatabase: StarSystemDatabase,
): string {
    const currentPlayerDestination = missionContext.currentItinerary.at(-1);
    const isPlayerGoingToTargetSystem =
        currentPlayerDestination !== undefined &&
        starSystemCoordinatesEquals(currentPlayerDestination, targetSystemCoordinates);

    const currentSystemPosition = starSystemDatabase.getSystemGalacticPosition(
        missionContext.currentSystem.model.coordinates,
    );

    if (!isPlayerGoingToTargetSystem) {
        return i18n.t("missions:common:openStarMap", {
            starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(
                ` ${i18n.t("common:or")} `,
            ),
        });
    } else {
        const nextSystemCoordinates = missionContext.currentItinerary.at(1);
        const nextSystemModel =
            nextSystemCoordinates !== undefined
                ? starSystemDatabase.getSystemModelFromCoordinates(nextSystemCoordinates)
                : null;
        if (nextSystemModel === null) {
            return i18n.t("missions:common:corruptedItinerary");
        }

        const distanceToNextSystemLy = Vector3.Distance(
            starSystemDatabase.getSystemGalacticPosition(nextSystemModel.coordinates),
            currentSystemPosition,
        );

        return i18n.t("missions:common:travelToNextSystem", {
            systemName: nextSystemModel.name,
            distance: parseDistance(lightYearsToMeters(distanceToNextSystemLy)),
            nbJumps: missionContext.currentItinerary.length - 1,
        });
    }
}
