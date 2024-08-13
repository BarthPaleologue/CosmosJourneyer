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

import { getStarGalacticCoordinates } from "../utils/getStarGalacticCoordinates";
import { SystemSeed } from "../utils/systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getNeighborStarSystems } from "../utils/getNeighborStarSystems";

type Node = {
    seed: SystemSeed;
    position: Vector3;
    G: number;
    H: number;
};

/**
 * Incremental A* pathfinder to find the shortest path between two star systems
 */
export class StellarPathfinder {
    private startSystem: {
        seed: SystemSeed;
        position: Vector3;
    } | null = null;

    private targetSystem: {
        seed: SystemSeed;
        position: Vector3;
    } | null = null;

    private seedToPrevious: Map<number, SystemSeed> = new Map();

    private openList: Node[] = [];
    private closedList: Node[] = [];

    private jumpRange = 10;

    private hasPath = false;
    private nbIterations = 0;

    private lastExploredNode: Node | null = null;

    /**
     * Initialize the pathfinder
     * @param startSystemSeed The seed of the starting system
     * @param targetSystemSeed The seed of the target system
     * @param jumpRange The jump range of the ship in light years
     */
    public init(startSystemSeed: SystemSeed, targetSystemSeed: SystemSeed, jumpRange: number) {
        this.seedToPrevious.clear();
        this.openList = [];
        this.closedList = [];
        this.hasPath = false;
        this.nbIterations = 0;
        this.lastExploredNode = null;

        this.startSystem = {
            seed: startSystemSeed,
            position: getStarGalacticCoordinates(startSystemSeed)
        };

        this.targetSystem = {
            seed: targetSystemSeed,
            position: getStarGalacticCoordinates(targetSystemSeed)
        };

        this.jumpRange = jumpRange;
    }

    private getHeuristic(node: Node): number {
        const position = node.position;

        if (this.targetSystem === null) {
            throw new Error("Target system is undefined");
        }
        const targetPosition = this.targetSystem.position;

        return Vector3.Distance(position, targetPosition);
    }

    private getNeighbors(node: Node): [Node, number][] {
        const stellarNeighbors = getNeighborStarSystems(node.seed, this.jumpRange);
        return stellarNeighbors.map<[Node, number]>(([seed, position, distance]) => [
            {
                seed,
                position,
                G: 0,
                H: 0
            },
            distance
        ]);
    }

    /**
     * Update the pathfinder to find the next step in the path.
     * Executes one A* iteration.
     */
    public update() {
        if (this.startSystem === null || this.targetSystem === null) {
            throw new Error("Cannot update pathfinder without initializing it first");
        }

        if (this.openList.length === 0) {
            console.log("Initializing pathfinder");
            this.openList.push({
                seed: this.startSystem.seed,
                position: this.startSystem.position,
                G: 0,
                H: 0
            });
        }

        const currentNode = this.openList.shift()!;
        this.closedList.push(currentNode);

        this.lastExploredNode = currentNode;

        console.log("Exploring", currentNode.seed.toString());

        if (currentNode.seed.equals(this.targetSystem.seed)) {
            console.log("Found path");
            this.hasPath = true;
            return;
        }

        const neighborsWithDistances = this.getNeighbors(currentNode);
        console.log("Found", neighborsWithDistances.length, "neighbors");
        for (let i = 0; i < neighborsWithDistances.length; i++) {
            const [neighbor, distance] = neighborsWithDistances[i];
            if (this.closedList.find((node) => node.seed.equals(neighbor.seed))) {
                continue;
            }

            const G = currentNode.G + distance;
            const H = this.getHeuristic(neighbor);

            const openNode = this.openList.find((node) => node.seed.equals(neighbor.seed));
            if (openNode) {
                if (G < openNode.G) {
                    openNode.G = G;
                    openNode.H = H;
                    this.seedToPrevious.set(neighbor.seed.hash, currentNode.seed);
                }
            } else {
                this.openList.push({
                    seed: neighbor.seed,
                    position: neighbor.position,
                    G,
                    H
                });
                this.seedToPrevious.set(neighbor.seed.hash, currentNode.seed);
            }
        }

        this.openList.sort((a, b) => a.G + a.H - b.G - b.H);

        this.hasPath = false;
        this.nbIterations++;
    }

    /**
     * Get the path between the start and target systems (ordered from start to target)
     * @returns An array of SystemSeed objects representing the path between the start and target systems
     * @throws An error if the pathfinder has not been initialized
     * @throws An error if no path has been found
     */
    getPath(): SystemSeed[] {
        if (this.startSystem === null || this.targetSystem === null) {
            throw new Error("Cannot get path without initializing the pathfinder first");
        }

        if (!this.hasPath) {
            throw new Error("No path found");
        }

        const path: SystemSeed[] = [];
        let currentSeed = this.targetSystem.seed;
        while (currentSeed !== this.startSystem.seed) {
            path.push(currentSeed);
            const previous = this.seedToPrevious.get(currentSeed.hash);
            if (previous === undefined) {
                throw new Error("Could not find a path to the target system");
            }
            currentSeed = previous;
        }
        path.push(this.startSystem.seed);

        return path.reverse();
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
        const currentDistance = Vector3.Distance(start, current);

        return Math.max(0, Math.min(1, currentDistance / totalDistance));
    }
}
