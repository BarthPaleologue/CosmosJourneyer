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

import { PriorityQueue } from "../src/ts/utils/priorityQueue";

test("PriorityList", () => {
    const queue = new PriorityQueue<number>((a, b) => a > b);

    expect(queue.isEmpty()).toBe(true);
    expect(queue.size()).toBe(0);

    queue.push(1);
    expect(queue.isEmpty()).toBe(false);
    expect(queue.size()).toBe(1);
    expect(queue.peek()).toBe(1);

    queue.push(2);
    expect(queue.isEmpty()).toBe(false);
    expect(queue.size()).toBe(2);
    expect(queue.peek()).toBe(2);

    queue.push(0);
    expect(queue.isEmpty()).toBe(false);
    expect(queue.size()).toBe(3);
    expect(queue.peek()).toBe(2);

    queue.push(3);
    expect(queue.isEmpty()).toBe(false);
    expect(queue.size()).toBe(4);
    expect(queue.peek()).toBe(3);

    const topValue = queue.pop();
    expect(topValue).toBe(3);
    expect(queue.isEmpty()).toBe(false);
    expect(queue.size()).toBe(3);
    expect(queue.peek()).toBe(2);

    queue.clear();
    expect(queue.isEmpty()).toBe(true);
    expect(queue.size()).toBe(0);
});
