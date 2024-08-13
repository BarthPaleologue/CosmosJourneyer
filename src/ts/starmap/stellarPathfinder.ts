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
 * A* pathfinder to find the shortest path between two stars
 */
export class StellarPathfinder {
    private startSystem: SystemSeed | null = null;
    private targetSystem: SystemSeed | null = null;

    private seedToPosition: Map<number, Vector3> = new Map();
    private seedToPrevious: Map<number, SystemSeed> = new Map();

    private openList: Node[] = [];
    private closedList: Node[] = [];

    private hasPath = false;

    public init(startSystem: SystemSeed, targetSystem: SystemSeed) {
        this.startSystem = startSystem;
        this.targetSystem = targetSystem;
        this.seedToPosition.clear();
        this.seedToPrevious.clear();
        this.openList = [];
        this.closedList = [];
        this.hasPath = false;

        const startPosition = getStarGalacticCoordinates(startSystem);
        const targetPosition = getStarGalacticCoordinates(targetSystem);

        this.seedToPosition.set(startSystem.hash, startPosition);
        this.seedToPosition.set(targetSystem.hash, targetPosition);
    }

    private getHeuristic(seed: SystemSeed): number {
        if (this.targetSystem === null) {
            throw new Error("Cannot compute heuristic without a target system");
        }
        const position = this.seedToPosition.get(seed.hash);
        if (position === undefined) {
            throw new Error("Cannot compute heuristic without a position");
        }

        const targetPosition = this.seedToPosition.get(this.targetSystem.hash)!;
        return Vector3.Distance(position, targetPosition);
    }

    private getNeighbors(node: Node): [Node, number][] {
        const stellarNeighbors = getNeighborStarSystems(node.seed, 10);
        stellarNeighbors.forEach(([seed, position, distance]) => {
            if (!this.seedToPosition.has(seed.hash)) {
                this.seedToPosition.set(seed.hash, position);
            }
        });
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

    public update() {
        if (this.startSystem === null || this.targetSystem === null) {
            throw new Error("Cannot update pathfinder without initializing it first");
        }

        if (this.openList.length === 0) {
            console.log("Initializing pathfinder");
            this.openList.push({
                seed: this.startSystem,
                position: this.seedToPosition.get(this.startSystem.hash)!,
                G: 0,
                H: this.getHeuristic(this.startSystem)
            });
        }

        const currentNode = this.openList.shift()!;
        this.closedList.push(currentNode);

        console.log("Exploring", currentNode.seed.toString());

        if (currentNode.seed.equals(this.targetSystem)) {
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
            const H = this.getHeuristic(neighbor.seed);

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
    }

    getPath(): SystemSeed[] {
        if (this.targetSystem === null) {
            throw new Error("Cannot get path without a target system");
        }

        if (!this.hasPath) {
            throw new Error("No path found");
        }

        const path: SystemSeed[] = [];
        let currentSeed = this.targetSystem;
        while (currentSeed !== this.startSystem) {
            path.push(currentSeed);
            const previous = this.seedToPrevious.get(currentSeed.hash);
            if (previous === undefined) {
                throw new Error("Could not find a path to the target system");
            }
            currentSeed = previous;
        }
        path.push(this.startSystem);

        return path.reverse();
    }

    hasFoundPath(): boolean {
        return this.hasPath;
    }
}
