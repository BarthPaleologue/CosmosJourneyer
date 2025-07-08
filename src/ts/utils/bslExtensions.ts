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

import { type TextureBlock } from "@babylonjs/core/Materials/Node/Blocks/Dual/textureBlock";
import { type NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { type RawTexture2DArray } from "@babylonjs/core/Materials/Textures/rawTexture2DArray";
import { type Texture } from "@babylonjs/core/Materials/Textures/texture";

import {
    acos,
    add,
    atan2,
    div,
    f,
    floor,
    fract,
    merge,
    mul,
    split,
    sub,
    texture2dArraySample,
    textureSample,
    vec2,
    type TextureBlockOptions,
} from "./bsl";
import { assertUnreachable } from "./types";

export function unitSphereToUv(positionUnitSphere: NodeMaterialConnectionPoint) {
    const splittedUnitSpherePosition = split(positionUnitSphere);

    const theta = acos(splittedUnitSpherePosition.y);
    const phi = atan2(splittedUnitSpherePosition.z, splittedUnitSpherePosition.x);

    const u = div(add(phi, f(Math.PI)), f(2.0 * Math.PI));
    const v = div(theta, f(Math.PI));

    return merge(sub(f(1.0), u), sub(f(1.0), v), null, null).xyOut;
}

export type BslTexture2d = {
    type: "texture_2d";
    texture: Texture;
};

export type BslTexture2dArrayMosaic = {
    type: "texture_2d_array_mosaic";
    array: RawTexture2DArray;
    tileCount: {
        x: number;
        y: number;
    };
};

/**
 * 2D texture sampler types that can be sampled using a simple UV coordinate.
 */
export type BslTexture2dUv = BslTexture2d | BslTexture2dArrayMosaic;

export function bslTextureSample2d(
    texture: BslTexture2dUv,
    uv: NodeMaterialConnectionPoint,
    options?: Partial<TextureBlockOptions>,
): TextureBlock {
    const textureType = texture.type;
    switch (textureType) {
        case "texture_2d":
            return textureSample(texture.texture, uv, options);
        case "texture_2d_array_mosaic":
            return bslTexture2dArrayMosaicSample(texture, uv, options);
        default:
            assertUnreachable(textureType);
    }
}

export function bslTexture2dArrayMosaicSample(
    texture: BslTexture2dArrayMosaic,
    uv: NodeMaterialConnectionPoint,
    options?: Partial<TextureBlockOptions>,
): TextureBlock {
    const splitUv = split(uv);

    const uvInvertedY = vec2(splitUv.x, sub(f(1.0), splitUv.y));

    const tileCountX = f(texture.tileCount.x);
    const tileCountY = f(texture.tileCount.y);

    const uvScaled = mul(uvInvertedY, vec2(tileCountX, tileCountY));

    const { x: tileIndexX, y: tileIndexY } = split(floor(uvScaled));

    const tileIndex = add(tileIndexX, mul(tileIndexY, tileCountX));

    const uvInTile = fract(uvScaled);

    return texture2dArraySample(texture.array, uvInTile, tileIndex, options);
}
