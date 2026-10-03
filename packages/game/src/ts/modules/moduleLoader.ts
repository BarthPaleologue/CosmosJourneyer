//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { err, ok } from "@cosmos-journeyer/typescript";
import type { Result } from "@cosmos-journeyer/typescript";

import { ChronosModule } from "./chronos";
import { DarkKnightModule } from "./darkKnight";
import type { GameModule } from "./gameModule";
import type { GameModuleApi } from "./gameModuleApi";
import { VestaModule } from "./vesta";

export function getBuiltinModules(): Array<GameModule> {
    return [DarkKnightModule, VestaModule, ChronosModule];
}

/**
 *
 * @param gameModules
 * @param api
 */
export function setupModules(gameModules: Iterable<GameModule>, api: GameModuleApi): Result<void, Error> {
    for (const gameModule of gameModules) {
        try {
            gameModule.setup(api);
        } catch (error) {
            return err(new Error(`Could not setup module "${gameModule.id}"`, { cause: error }));
        }
    }

    return ok(undefined);
}
