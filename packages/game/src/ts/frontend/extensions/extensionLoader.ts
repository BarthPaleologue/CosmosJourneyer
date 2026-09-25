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

import { DarkKnightExtension } from "./darkKnight";
import type { ExtensionPoints, GameExtension } from "./gameExtension";

export function initBuiltinExtensions(): Array<GameExtension> {
    return [new DarkKnightExtension()];
}

/**
 *
 * @param extensions
 * @param extensionPoints
 */
export function loadExtensions(
    extensions: Iterable<GameExtension>,
    extensionPoints: ExtensionPoints,
): Result<undefined, Error> {
    try {
        for (const extension of extensions) {
            extension.register(extensionPoints);
        }
        return ok(undefined);
    } catch (error) {
        return err(new Error("Could not load all extensions", { cause: error }));
    }
}
