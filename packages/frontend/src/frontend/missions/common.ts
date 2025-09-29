import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { wrapVector3 } from "@/frontend/helpers/algebra";
import { pressInteractionToStrings } from "@/frontend/helpers/inputControlsString";
import { GeneralInputs } from "@/frontend/inputs/generalInputs";

import { lightYearsToMeters } from "@/utils/physics/unitConversions";
import { parseDistance } from "@/utils/strings/parseToStrings";

import i18n from "@/i18n";

import { type MissionContext } from "./missionContext";

export function getGoToSystemInstructions(
    missionContext: MissionContext,
    targetSystemCoordinates: StarSystemCoordinates,
    keyboardLayout: Map<string, string>,
    starSystemDatabase: StarSystemDatabase,
): string {
    const itinerary = missionContext.currentItinerary;
    if (itinerary === null) {
        return i18n.t("missions:common:openStarMap", {
            starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(
                ` ${i18n.t("common:or")} `,
            ),
        });
    }

    const currentPlayerDestination = itinerary.at(-1);
    const isPlayerGoingToTargetSystem =
        currentPlayerDestination !== undefined &&
        starSystemCoordinatesEquals(currentPlayerDestination, targetSystemCoordinates);

    const currentSystemPosition = wrapVector3(
        starSystemDatabase.getSystemGalacticPosition(missionContext.currentSystem.model.coordinates),
    );

    if (!isPlayerGoingToTargetSystem) {
        return i18n.t("missions:common:openStarMap", {
            starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(
                ` ${i18n.t("common:or")} `,
            ),
        });
    } else {
        const nextSystemCoordinates = itinerary[1];
        const nextSystemModel = starSystemDatabase.getSystemModelFromCoordinates(nextSystemCoordinates);
        if (nextSystemModel === null) {
            return i18n.t("missions:common:corruptedItinerary");
        }

        const distanceToNextSystemLy = Vector3.Distance(
            wrapVector3(starSystemDatabase.getSystemGalacticPosition(nextSystemModel.coordinates)),
            currentSystemPosition,
        );

        return i18n.t("missions:common:travelToNextSystem", {
            systemName: nextSystemModel.name,
            distance: parseDistance(lightYearsToMeters(distanceToNextSystemLy)),
            nbJumps: itinerary.length - 1,
        });
    }
}
