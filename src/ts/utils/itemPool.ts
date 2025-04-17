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

// helper to describe a constructor taking some args and producing an instance
type Constructor<Args extends unknown[], Instance> = new (...args: Args) => Instance;

export class ItemPool<Instance, Args extends unknown[]> {
    private pool: Instance[] = [];

    constructor(private readonly ctor: Constructor<Args, Instance>) {}

    /** Grab one from the pool, or make a fresh one with `new ctor(...args)` */
    get(...args: Args): Instance {
        return this.pool.pop() ?? new this.ctor(...args);
    }

    /** Return an instance to the pool */
    release(item: Instance): void {
        this.pool.push(item);
    }
}
