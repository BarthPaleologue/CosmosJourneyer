//  This file is part of CosmosJourneyer
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

import { Matrix, Quaternion, Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

export enum UniformEnumType {
    /**
     * The type to use when BabylonJS manages the uniform itself (like textureSampler)
     */
    Auto,
    /**
     * A float32. Shader code: float
     */
    Float,
    /**
     * A int32. Shader code: int
     */
    Int,
    /**
     * A boolean. Shader code: bool
     */
    Bool,
    /**
     * A Vector3. Shader code: vec3
     */
    Vector3,
    /**
     * A Color3. Shader code: vec3
     */
    Color3,
    /**
     * A 4x4 matrix. Shader code: mat4
     */
    Matrix,
    /**
     * A quaternion. Shader code: vec4
     */
    Quaternion,
    /**
     * An array of Vector3. Shader code: vec3[]
     */
    Vector3Array,
    /**
     * An array of Vector4. Shader code: vec4[]
     */
    Vector4Array,
    /**
     * An array of floats. Shader code: float[]
     */
    FloatArray
}

export enum SamplerEnumType {
    Auto,
    Texture
}

export type UniformType = number | boolean | Vector3 | Color3 | Matrix | Quaternion | Texture | Vector3[] | Vector4[] | number[];

export type SamplerType = Texture | undefined;

export type UniformData<T> = {
    name: string;
    type: UniformEnumType;
    get: () => T;
};

export type SamplerData<T> = {
    name: string;
    type: SamplerEnumType;
    get: () => T;
};

export type ShaderUniforms = UniformData<UniformType>[];
export type ShaderSamplers = SamplerData<SamplerType>[];
