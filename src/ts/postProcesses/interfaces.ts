import { Color3, Matrix, Quaternion, Texture, Vector3, Vector4 } from "@babylonjs/core";

export enum ShaderDataType {
    Auto,
    Float,
    Int,
    Bool,
    Vector3,
    Color3,
    Matrix,
    Quaternion,
    Texture,
    Vector3Array,
    Vector4Array
}

export type shaderData = number | boolean | Vector3 | Color3 | Matrix | Quaternion | Texture | Vector3[] | Vector4[];

export interface ShaderData<shaderData> {
    name: string;
    type: ShaderDataType;
    get: () => shaderData;
}

export type ShaderUniforms = ShaderData<shaderData>[];
export type ShaderSamplers = ShaderData<shaderData>[];
