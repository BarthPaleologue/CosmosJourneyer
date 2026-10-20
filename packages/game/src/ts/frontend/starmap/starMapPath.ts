//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GreasedLineTools } from "@babylonjs/core/Misc/greasedLineTools";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { serializeStarSystemCoordinates, starSystemCoordinatesEquals } from "@cosmos-journeyer/universe-model";
import type { StarSystemCoordinates } from "@cosmos-journeyer/universe-model";

import { wrapVector3 } from "@/frontend/helpers/algebra";

import type { Vector3Like } from "@/utils/types";

export type StarSystemSegment = DeepReadonly<{
    from: StarSystemCoordinates;
    to: StarSystemCoordinates;
}>;

export type GreasedLinePath = Readonly<{
    points: Vector3[];
    widths: number[];
}>;

type GetSystemGalacticPosition = (system: DeepReadonly<StarSystemCoordinates>) => Vector3Like;

/**
 * Creates a canonical key for a system-to-system edge independent of direction.
 * @param from First endpoint's star system coordinates.
 * @param to Second endpoint's star system coordinates.
 * @returns Stable key shared by the edge in either direction.
 */
function getUndirectedSystemSegmentKey(
    from: DeepReadonly<StarSystemCoordinates>,
    to: DeepReadonly<StarSystemCoordinates>,
): string {
    const fromKey = serializeStarSystemCoordinates(from);
    const toKey = serializeStarSystemCoordinates(to);

    return fromKey < toKey ? `${fromKey}|${toKey}` : `${toKey}|${fromKey}`;
}

/**
 * Extracts unique undirected edges from a route, skipping repeats and self-edges.
 * @param systems Ordered star systems that form the route.
 * @returns Unique adjacent system segments in encounter order.
 */
export function getUniqueSystemSegments(systems: DeepReadonly<Array<StarSystemCoordinates>>): StarSystemSegment[] {
    const visitedSegmentKeys = new Set<string>();
    const segments: StarSystemSegment[] = [];

    for (let index = 1; index < systems.length; index++) {
        const from = systems[index - 1];
        const to = systems[index];

        if (from === undefined || to === undefined) {
            continue;
        }

        if (serializeStarSystemCoordinates(from) === serializeStarSystemCoordinates(to)) {
            continue;
        }

        const segmentKey = getUndirectedSystemSegmentKey(from, to);
        if (visitedSegmentKeys.has(segmentKey)) {
            continue;
        }

        visitedSegmentKeys.add(segmentKey);
        segments.push({ from, to });
    }

    return segments;
}

/**
 * Builds a greased-line path from unique route segments, hiding gaps between disjoint runs.
 * @param systems Ordered star systems that form the route.
 * @param getSystemGalacticPosition Resolves each system's galactic position.
 * @returns Line points and paired widths for rendering the route.
 */
export function getGreasedLinePathFromSystemSegments(
    systems: DeepReadonly<Array<StarSystemCoordinates>>,
    getSystemGalacticPosition: GetSystemGalacticPosition,
): GreasedLinePath {
    const points: Vector3[] = [];
    const widths: number[] = [];
    let lastDrawnSystem: DeepReadonly<StarSystemCoordinates> | null = null;
    let currentRun: Array<DeepReadonly<StarSystemCoordinates>> = [];

    const pushPoint = (system: DeepReadonly<StarSystemCoordinates>, width: number): void => {
        points.push(wrapVector3(getSystemGalacticPosition(system)));
        widths.push(width, width);
    };

    const pushVisibleRun = (): void => {
        if (currentRun.length < 2) {
            currentRun = [];
            return;
        }

        const runPoints = currentRun.map((system) => wrapVector3(getSystemGalacticPosition(system)));
        const segmentizedRunPoints = GreasedLineTools.SegmentizeLineBySegmentCount(runPoints, currentRun.length - 1);

        segmentizedRunPoints.forEach((point) => {
            points.push(point);
            widths.push(1, 1);
        });

        lastDrawnSystem = currentRun.at(-1) ?? null;
        currentRun = [];
    };

    const pushInvisibleConnectorTo = (system: DeepReadonly<StarSystemCoordinates>): void => {
        if (lastDrawnSystem !== null && !starSystemCoordinatesEquals(lastDrawnSystem, system)) {
            pushPoint(lastDrawnSystem, 0);
            pushPoint(system, 0);
        }
    };

    for (const segment of getUniqueSystemSegments(systems)) {
        if (currentRun.length === 0) {
            pushInvisibleConnectorTo(segment.from);
            currentRun = [segment.from, segment.to];
            continue;
        }

        const currentRunEnd = currentRun.at(-1);
        if (currentRunEnd !== undefined && starSystemCoordinatesEquals(currentRunEnd, segment.from)) {
            currentRun.push(segment.to);
            continue;
        }

        pushVisibleRun();
        pushInvisibleConnectorTo(segment.from);
        currentRun = [segment.from, segment.to];
    }

    pushVisibleRun();

    return { points, widths };
}
