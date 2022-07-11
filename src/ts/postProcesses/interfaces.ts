import { Color3, Matrix, Quaternion, Texture, Vector3 } from "@babylonjs/core";

export enum ShaderDataType {
    Auto,
    Float,
    Int,
    Vector3,
    Color3,
    Matrix,
    Quaternion,
    Texture,
    Vector3Array
}

export type shaderData = number | Vector3 | Color3 | Matrix | Quaternion | Texture | Vector3[];

export interface ShaderData<shaderData> {
    name: string;
    type: ShaderDataType;
    get: () => shaderData;
}

export type ShaderUniforms = ShaderData<shaderData>[];
export type ShaderSamplers = ShaderData<shaderData>[];
