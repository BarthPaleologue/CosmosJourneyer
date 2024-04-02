//  This file is part of Cosmos Journeyer
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

export const enum UniformEnumType {
    /**
     * The type to use when BabylonJS manages the uniform itself (like textureSampler)
     */
    AUTO,
    /**
     * A float32. Shader code: float
     */
    FLOAT,
    /**
     * A int32. Shader code: int
     */
    INT,
    /**
     * A boolean. Shader code: bool
     */
    BOOL,
    /**
     * A Vector3. Shader code: vec3
     */
    VECTOR_3,
    /**
     * A Color3. Shader code: vec3
     */
    COLOR_3,
    /**
     * A 4x4 matrix. Shader code: mat4
     */
    MATRIX,
    /**
     * A quaternion. Shader code: vec4
     */
    QUATERNION,
    /**
     * An array of Vector3. Shader code: vec3[]
     */
    VECTOR_3_ARRAY,
    /**
     * An array of Vector4. Shader code: vec4[]
     */
    VECTOR_4_ARRAY,
    /**
     * An array of floats. Shader code: float[]
     */
    FLOAT_ARRAY,
    /**
     * An array of Color3. Shader code: vec3[]
     */
    COLOR_3_ARRAY
}

export const enum SamplerEnumType {
    AUTO,
    TEXTURE
}

export type UniformType = number | boolean | Vector3 | Color3 | Matrix | Quaternion | Texture | Vector3[] | Vector4[] | number[] | Color3[];

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
