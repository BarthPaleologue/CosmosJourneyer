import type { HasBoundingSphere } from "./architecture/hasBoundingSphere";
import type { Transformable } from "./architecture/transformable";
import type { ManagesLandingPads } from "./orbitalFacility/managesLandingPads";

export type SpatialGeometry = Transformable & HasBoundingSphere;

export type SystemObject = SpatialGeometry & {
    id: string;
    name: string;
};

export type LandableFacility = SystemObject & ManagesLandingPads;
