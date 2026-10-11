import type { ILandingPad, LandingPadProvider } from "../universe/orbitalFacility/landingPadProvider";
import type { SystemObject } from "../universe/systemObject";
import type { SystemEntity } from "./systemEntity";
import type { SystemEntityProcessors } from "./systemEntityProcessors";

export type LandingFacility = {
    object: SystemObject;
    pads: LandingPadProvider;
};

/**
 * Keeps a reserved pad attached to its owner; otherwise selects the nearest spatial object.
 * @param entities Loaded entities in the current system.
 * @param processors Geometry and pad capabilities registered by modules.
 * @param nearestObject Object nearest to the ship.
 * @param reservedPad Current landing target, including after touchdown.
 * @returns The installation available for landing requests or servicing the current landing.
 */
export function findLandingFacility(
    entities: Iterable<SystemEntity>,
    processors: Pick<SystemEntityProcessors, "landingPadProviders" | "spatialGeometry">,
    nearestObject: SystemObject,
    reservedPad: ILandingPad | null,
): LandingFacility | null {
    for (const entity of entities) {
        const pads = processors.landingPadProviders.dispatch(entity);
        if (pads === null) {
            continue;
        }
        const matches =
            reservedPad === null ? entity.model.id === nearestObject.id : pads.getLandingPads().includes(reservedPad);
        if (!matches) {
            continue;
        }
        const geometry = processors.spatialGeometry.dispatch(entity);
        if (geometry === null) {
            continue;
        }
        return {
            object: {
                id: entity.model.id,
                name: entity.model.name,
                getTransform: () => geometry.getTransform(),
                getBoundingRadius: () => geometry.getBoundingRadius(),
            },
            pads,
        };
    }
    return null;
}
