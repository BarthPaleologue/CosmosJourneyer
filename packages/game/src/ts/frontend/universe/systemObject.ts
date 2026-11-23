import type { HasBoundingSphere } from "./architecture/hasBoundingSphere";
import type { OrbitalObject } from "./architecture/orbitalObject";
import type { Transformable } from "./architecture/transformable";
import type { ManagesLandingPads } from "./orbitalFacility/managesLandingPads";

export type SpatialGeometry = Transformable & HasBoundingSphere;

export type SystemObject = SpatialGeometry & {
    id: string;
    name: string;
};

/** Any object in space the ship can be near, discriminated by kind. */
export type SpaceObject =
    | { readonly kind: "orbitalObject"; readonly object: OrbitalObject }
    | { readonly kind: "systemObject"; readonly object: SystemObject };

export type LandableFacility = SystemObject & ManagesLandingPads;
