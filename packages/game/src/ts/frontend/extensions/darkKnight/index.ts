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

import { ok } from "@cosmos-journeyer/typescript";
import type { Result } from "@cosmos-journeyer/typescript";
import type { DarkKnightModel } from "@cosmos-journeyer/universe-model";

import { DarkKnight } from "../../universe/darkKnight";
import type {
    SystemContentFactory,
    GameExtension,
    ExtensionPoints,
    SystemContentContext,
    SystemContent,
} from "../gameExtension";

export class DarkKnightExtension implements GameExtension, SystemContentFactory<DarkKnightModel> {
    readonly id = "dark-knight";

    readonly type = "darkKnight";

    register(context: ExtensionPoints): void {
        context.systemContent.registerObjectFactory(this);
    }

    create(model: DarkKnightModel, context: SystemContentContext): Result<SystemContent, Error> {
        return ok(new DarkKnight(model, context.scene));
    }
}
