import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { lightYearsToMeters } from "@cosmos-journeyer/physics";
import { starSystemCoordinatesEquals } from "@cosmos-journeyer/universe-model";
import type { StarSystemCoordinates } from "@cosmos-journeyer/universe-model";
import type { TFunction } from "i18next";

import type { UniverseBackend } from "@/backend/universe/universeBackend";

import { GeneralInputs } from "@/frontend/gameplay/inputs/generalInputs";
import { wrapVector3 } from "@/frontend/helpers/algebra";
import { pressInteractionToStrings } from "@/frontend/helpers/inputControlsString";

import { parseDistance } from "@/utils/strings/parseToStrings";

import type { MissionContext } from "./missionContext";

export function getGoToSystemInstructions(
    missionContext: MissionContext,
    targetSystemCoordinates: StarSystemCoordinates,
    keyboardLayout: Map<string, string>,
    universeBackend: UniverseBackend,
    t: TFunction,
): string {
    const itinerary = missionContext.currentItinerary;
    if (itinerary === null) {
        return t("missions:common:openStarMap", {
            starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(
                ` ${t("common:or")} `,
            ),
        });
    }

    const currentPlayerDestination = itinerary.at(-1);
    const isPlayerGoingToTargetSystem =
        currentPlayerDestination !== undefined &&
        starSystemCoordinatesEquals(currentPlayerDestination, targetSystemCoordinates);

    const currentSystemPosition = wrapVector3(
        universeBackend.getSystemGalacticPosition(missionContext.currentSystem.model.coordinates),
    );

    if (!isPlayerGoingToTargetSystem) {
        return t("missions:common:openStarMap", {
            starMapKey: pressInteractionToStrings(GeneralInputs.map.toggleStarMap, keyboardLayout).join(
                ` ${t("common:or")} `,
            ),
        });
    } else {
        const nextSystemCoordinates = itinerary[1];
        const nextSystemModel = universeBackend.getSystemModelFromCoordinates(nextSystemCoordinates);
        if (nextSystemModel === null) {
            return t("missions:common:corruptedItinerary");
        }

        const distanceToNextSystemLy = Vector3.Distance(
            wrapVector3(universeBackend.getSystemGalacticPosition(nextSystemModel.coordinates)),
            currentSystemPosition,
        );

        return t("missions:common:travelToNextSystem", {
            systemName: nextSystemModel.name,
            distance: parseDistance(lightYearsToMeters(distanceToNextSystemLy), t),
            nbJumps: itinerary.length - 1,
        });
    }
}
