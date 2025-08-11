import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { IUniverseBackend } from "@/backend/universe";
import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";

import { GeneralInputs } from "@/frontend/inputs/generalInputs";

import { lightYearsToMeters } from "@/utils/physics/unitConversions";
import { pressInteractionToStrings } from "@/utils/strings/inputControlsString";
import { parseDistance } from "@/utils/strings/parseToStrings";

import i18n from "@/i18n";

import { type MissionContext } from "./missionContext";

export function getGoToSystemInstructions(
    missionContext: MissionContext,
    targetSystemCoordinates: StarSystemCoordinates,
    keyboardLayout: Map<string, string>,
    universeBackend: IUniverseBackend,
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

    const currentSystemPosition = universeBackend.getSystemGalacticPosition(
        missionContext.currentSystem.model.coordinates,
    );

    if (!isPlayerGoingToTargetSystem) {
        return i18n.t("missions:common:openStarMap", {
            starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(
                ` ${i18n.t("common:or")} `,
            ),
        });
    } else {
        const nextSystemCoordinates = itinerary[1];
        const nextSystemModel = universeBackend.getSystemModelFromCoordinates(nextSystemCoordinates);
        if (nextSystemModel === null) {
            return i18n.t("missions:common:corruptedItinerary");
        }

        const distanceToNextSystemLy = Vector3.Distance(
            universeBackend.getSystemGalacticPosition(nextSystemModel.coordinates),
            currentSystemPosition,
        );

        return i18n.t("missions:common:travelToNextSystem", {
            systemName: nextSystemModel.name,
            distance: parseDistance(lightYearsToMeters(distanceToNextSystemLy)),
            nbJumps: itinerary.length - 1,
        });
    }
}
