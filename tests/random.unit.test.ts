//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { pickPseudoRandomItems } from "../src/ts/utils/random";

test("pickPseudoRandomItems", () => {
    const items = [0, 1, 2, 3, 4, 5];
    for (let i = 0; i < 1000; i++) {
        const nbItemsToPick = Math.floor(Math.random() * 5);
        const rng = (index: number) => Math.random();
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
