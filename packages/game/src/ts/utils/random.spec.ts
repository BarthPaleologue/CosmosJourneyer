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

import { expect, test } from "vitest";

import { pickPseudoRandomItems, randomPieChart } from "./random";

test("pickPseudoRandomItems", () => {
    const items = [0, 1, 2, 3, 4, 5];
    const rng = () => Math.random();
    for (let i = 0; i < 1000; i++) {
        const nbItemsToPick = Math.floor(Math.random() * 5);
        const results = pickPseudoRandomItems(items, nbItemsToPick, rng, 0);

        // check we get the expected number of items
        expect(results.length).toBe(nbItemsToPick);

        // check that every result item only occurs once
        for (const result of results) {
            const nbOccurence = results.filter((otherResult) => otherResult === result).length;
            expect(nbOccurence).toBe(1);
        }
    }
});

test("randomPieChart", () => {
    const rng = () => Math.random();
    for (let i = 0; i < 1000; i++) {
        const nbSlices = 1 + Math.floor(Math.random() * 20);
        const pieChart = randomPieChart(nbSlices, rng, 0);

        expect(pieChart.length).toBe(nbSlices);

        let sum = 0;
        pieChart.forEach((slice) => (sum += slice));
        expect(sum).toBeCloseTo(1.0);
    }
});
