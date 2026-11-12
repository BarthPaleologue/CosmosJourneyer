// MIT License
//
// Copyright (c) 2025 Barthélemy Paléologue
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { ImageSourceBlock } from "@babylonjs/core/Materials/Node/Blocks/Dual/imageSourceBlock";
import { TextureBlock } from "@babylonjs/core/Materials/Node/Blocks/Dual/textureBlock";
import { TriPlanarBlock } from "@babylonjs/core/Materials/Node/Blocks/triPlanarBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";

import { parse } from "./bslInput";
import type { BslInput } from "./bslInput";
import { Target } from "./target";
import type { TargetOptions } from "./target";

export type TextureBlockOptions = TargetOptions & {
    convertToLinearSpace: boolean;
    convertToGammaSpace: boolean;
    disableLevelMultiplication: boolean;
};

/**
 * Samples a texture using the given UV coordinates and optional properties.
 * @param texture - The texture to sample.
 * @param uv - The UV coordinates.
 * @param options - Optional properties for the texture block.
 * @returns The configured texture sampling block.
 */
export function textureSample(
    texture: NodeMaterialConnectionPoint,
    uv: BslInput,
    options?: Partial<TextureBlockOptions>,
): TextureBlock {
    const textureBlock = new TextureBlock("texture");
    textureBlock.target = options?.target ?? NodeMaterialBlockTargets.Fragment;
    textureBlock.convertToGammaSpace = options?.convertToGammaSpace ?? false;
    textureBlock.convertToLinearSpace = options?.convertToLinearSpace ?? false;
    textureBlock.disableLevelMultiplication = options?.disableLevelMultiplication ?? false;

    texture.connectTo(textureBlock.source);
    parse(uv, options).connectTo(textureBlock.uv);

    return textureBlock;
}

export type UniformTexture2d = {
    source: ImageSourceBlock["source"];
    dimensions: ImageSourceBlock["dimensions"];
};

/**
 * Returns a texture uniform with an ImageSourceBlock.
 * @param texture - The texture to expose.
 * @param options - Optional target options.
 * @returns Image source connection points for the texture and its dimensions.
 */
export function uniformTexture2d(texture: Texture, options?: Partial<TargetOptions>): UniformTexture2d {
    const imageSourceBlock = new ImageSourceBlock(`${texture.name}SourceBlock`);
    imageSourceBlock.target = options?.target ?? Target.VERT_AND_FRAG;
    imageSourceBlock.texture = texture;

    return imageSourceBlock;
}

export type TriPlanarSampleOptions = TargetOptions & {
    sharpness: BslInput;
    convertToLinearSpace: boolean;
    convertToGammaSpace: boolean;
};

/**
 * Samples a texture using triplanar mapping based on the position and normal.
 * @param texture - The texture to sample.
 * @param position - The world position.
 * @param normal - The world normal.
 * @param options - Optional properties for the triplanar sampling.
 * @returns The configured triplanar sampling block.
 */
export function textureTriPlanarSample(
    texture: NodeMaterialConnectionPoint,
    position: BslInput,
    normal: BslInput,
    options?: Partial<TriPlanarSampleOptions>,
): TriPlanarBlock {
    const triPlanarBlock = new TriPlanarBlock("TriPlanar");

    triPlanarBlock.convertToGammaSpace = options?.convertToGammaSpace ?? false;
    triPlanarBlock.convertToLinearSpace = options?.convertToLinearSpace ?? false;

    texture.connectTo(triPlanarBlock.source);

    parse(position, options).connectTo(triPlanarBlock.position);
    parse(normal, options).connectTo(triPlanarBlock.normal);

    parse(options?.sharpness, options)?.connectTo(triPlanarBlock.sharpness);

    return triPlanarBlock;
}

/**
 * Samples up to three textures using triplanar mapping.
 * @param textures - The X, Y, and Z textures (optional per axis).
 * @param position - The world position.
 * @param normal - The world normal.
 * @param options - Optional triplanar sampling options.
 * @returns The configured triplanar sampling block.
 */
export function triPlanarMapping(
    textures: [NodeMaterialConnectionPoint?, NodeMaterialConnectionPoint?, NodeMaterialConnectionPoint?],
    position: BslInput,
    normal: BslInput,
    options?: Partial<TriPlanarSampleOptions>,
): TriPlanarBlock {
    const triPlanarBlock = new TriPlanarBlock("TriPlanar");

    textures[0]?.connectTo(triPlanarBlock.source);
    textures[1]?.connectTo(triPlanarBlock.sourceY);
    if (triPlanarBlock.sourceZ !== null) {
        textures[2]?.connectTo(triPlanarBlock.sourceZ);
    }

    triPlanarBlock.convertToGammaSpace = options?.convertToGammaSpace ?? false;
    triPlanarBlock.convertToLinearSpace = options?.convertToLinearSpace ?? false;

    parse(position, options).connectTo(triPlanarBlock.position);
    parse(normal, options).connectTo(triPlanarBlock.normal);

    parse(options?.sharpness, options)?.connectTo(triPlanarBlock.sharpness);

    return triPlanarBlock;
}
