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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { wrapVector3 } from "@/frontend/helpers/algebra";
import { getNeighborStarSystemCoordinates } from "@/frontend/helpers/getNeighborStarSystems";

import { PriorityQueue } from "@/utils/priorityQueue";
import { err, ok, type Result } from "@/utils/types";

type Node = {
    coordinates: StarSystemCoordinates;
    position: Vector3;
    G: number;
    H: number;
};

/**
 * Incremental A* pathfinder to find the shortest path between two star systems
 */
export class StellarPathfinder {
    private startSystem: {
        coordinates: StarSystemCoordinates;
        position: Vector3;
    } | null = null;

    private targetSystem: {
        coordinates: StarSystemCoordinates;
        position: Vector3;
    } | null = null;

    private coordinatesToPrevious: Map<string, StarSystemCoordinates> = new Map();

    private openList: PriorityQueue<Node> = new PriorityQueue((a, b) => a.G + a.H < b.G + b.H);
    private closedList: Node[] = [];

    private jumpRange = 10;

    private hasPath = false;
    private nbIterations = 0;

    private lastExploredNode: Node | null = null;

    private starSystemDatabase: StarSystemDatabase;

    public constructor(starSystemDatabase: StarSystemDatabase) {
        this.starSystemDatabase = starSystemDatabase;
    }

    /**
     * Initialize the pathfinder
     * @param startSystemCoordinates The seed of the starting system
     * @param targetSystemCoordinates The seed of the target system
     * @param jumpRange The jump range of the ship in light years
     */
    public init(
        startSystemCoordinates: StarSystemCoordinates,
        targetSystemCoordinates: StarSystemCoordinates,
        jumpRange: number,
    ) {
        this.coordinatesToPrevious.clear();
        this.openList.clear();
        this.closedList = [];
        this.hasPath = false;
        this.nbIterations = 0;
        this.lastExploredNode = null;

        this.startSystem = {
            coordinates: startSystemCoordinates,
            position: wrapVector3(this.starSystemDatabase.getSystemGalacticPosition(startSystemCoordinates)),
        };

        this.targetSystem = {
            coordinates: targetSystemCoordinates,
            position: wrapVector3(this.starSystemDatabase.getSystemGalacticPosition(targetSystemCoordinates)),
        };

        this.jumpRange = jumpRange;
    }

    public hasBeenInit(): boolean {
        return this.startSystem !== null && this.targetSystem !== null;
    }

    private getHeuristic(node: Node): number {
        const position = node.position;

        if (this.targetSystem === null) {
            throw new Error("Target system is undefined");
        }
        const targetPosition = this.targetSystem.position;

        return Vector3.Distance(position, targetPosition);
    }

    private getNeighbors(node: Node): Array<{ node: Node; distance: number }> {
        const stellarNeighbors = getNeighborStarSystemCoordinates(
            node.coordinates,
            this.jumpRange,
            this.starSystemDatabase,
        );
        return stellarNeighbors.map<{ node: Node; distance: number }>(({ coordinates, position, distance }) => {
            return {
                node: {
                    coordinates: coordinates,
                    position,
                    G: 0,
                    H: 0,
                },
                distance: distance,
            };
        });
    }

    /**
     * Update the pathfinder to find the next step in the path.
     * Executes one A* iteration.
     */
    public update() {
        if (this.startSystem === null || this.targetSystem === null) {
            throw new Error("Cannot update pathfinder without initializing it first");
        }

        if (this.openList.size() === 0) {
            this.openList.push({
                coordinates: this.startSystem.coordinates,
                position: this.startSystem.position,
                G: 0,
                H: 0,
            });
        }

        const currentNode = this.openList.pop();
        if (currentNode === undefined) {
            throw new Error("No more nodes to explore");
        }
        this.closedList.push(currentNode);

        this.lastExploredNode = currentNode;

        if (starSystemCoordinatesEquals(currentNode.coordinates, this.targetSystem.coordinates)) {
            this.hasPath = true;
            return;
        }

        const neighborsWithDistances = this.getNeighbors(currentNode);
        for (const { node: neighbor, distance } of neighborsWithDistances) {
            if (this.closedList.find((node) => starSystemCoordinatesEquals(node.coordinates, neighbor.coordinates))) {
                // if the neighbor is already in the closed list, skip it
                continue;
            }

            const G = currentNode.G + distance;
            const H = this.getHeuristic(neighbor);

            const openNode = this.openList.find((node) =>
                starSystemCoordinatesEquals(node.coordinates, neighbor.coordinates),
            );
            if (openNode !== undefined) {
                // if the neighbor is already in the open list, update its G value if the new path is shorter
                if (G < openNode.G) {
                    openNode.G = G;
                    openNode.H = H;
                    this.coordinatesToPrevious.set(JSON.stringify(neighbor.coordinates), currentNode.coordinates);
                }
            } else {
                this.openList.push({
                    coordinates: neighbor.coordinates,
                    position: neighbor.position,
                    G,
                    H,
                });
                this.coordinatesToPrevious.set(JSON.stringify(neighbor.coordinates), currentNode.coordinates);
            }
        }

        this.hasPath = false;
        this.nbIterations++;
    }

    /**
     * Get the path between the start and target systems (ordered from start to target)
     * @returns An array of StarSystemCoordinates objects representing the path between the start and target systems
     */
    getPath(): Result<Array<StarSystemCoordinates>, Error> {
        if (this.startSystem === null || this.targetSystem === null) {
            return err(new Error("Cannot get path without initializing the pathfinder first"));
        }

        if (!this.hasPath) {
            return err(new Error("No path found"));
        }

        const path: StarSystemCoordinates[] = [];
        let currentCoordinates = this.targetSystem.coordinates;
        while (currentCoordinates !== this.startSystem.coordinates) {
            if (path.length >= 2 ** 32) {
                return err(
                    new Error(
                        `Path between ${JSON.stringify(this.startSystem.coordinates)} and ${JSON.stringify(this.targetSystem.coordinates)} is too long, exceeding 2^32 elements! There might be a loop somewhere...`,
                    ),
                );
            }
            path.push(currentCoordinates);
            const previous = this.coordinatesToPrevious.get(JSON.stringify(currentCoordinates));
            if (previous === undefined) {
                return err(new Error("Could not find a path to the target system"));
            }
            currentCoordinates = previous;
        }
        path.push(this.startSystem.coordinates);

        return ok(path.reverse());
    }

    /**
     * Get the number of iterations executed by the pathfinder
     * @returns The number of iterations executed by the pathfinder. Will return 0 if the pathfinder has not been initialized.
     */
    getNbIterations(): number {
        return this.nbIterations;
    }

    /**
     * Check if the pathfinder has found a path between the start and target systems
     * @returns True if a path has been found, false otherwise. Will return false if the pathfinder has not been initialized.
     */
    hasFoundPath(): boolean {
        return this.hasPath;
    }

    /**
     * Get the progress of the pathfinder as a number between 0 and 1
     */
    getProgress(): number {
        if (this.startSystem === null || this.targetSystem === null) {
            throw new Error("Cannot get progress without initializing the pathfinder first");
        }

        if (this.lastExploredNode === null) {
            return 0;
        }

        const start = this.startSystem.position;
        const target = this.targetSystem.position;
        const current = this.lastExploredNode.position;

        const totalDistance = Vector3.Distance(start, target);
        const currentDistance = Vector3.Distance(target, current);

        return 1.0 - Math.max(0, Math.min(1, currentDistance / totalDistance));
    }
}
