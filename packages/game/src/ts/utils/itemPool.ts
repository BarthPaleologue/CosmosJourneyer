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

export class ItemPool<TItem> {
    private pool: Array<TItem> = [];

    private readonly makeItem: () => TItem;

    constructor(makeItem: () => TItem) {
        this.makeItem = makeItem;
    }

    /** Grab one from the pool, or make a fresh one with `new ctor(...args)` */
    get(): TItem {
        return this.pool.pop() ?? this.makeItem();
    }

    /** Return an instance to the pool */
    release(item: TItem): void {
        this.pool.push(item);
    }
}
