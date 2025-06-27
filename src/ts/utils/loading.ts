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

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import { err, ok, type Result } from "./types";

export function loadTextureFromUrl(name: string, url: string, scene: Scene): Promise<Result<Texture, Error>> {
    return new Promise((resolve) => {
        const texture = new Texture(
            url,
            scene,
            false,
            false,
            undefined,
            () => {
                resolve(ok(texture));
            },
            (message, exception) => {
                resolve(
                    err(new Error(`Failed to load texture ${name} from ${url}: ${message}, exception: ${exception}`)),
                );
            },
        );
        texture.name = name;
    });
}
