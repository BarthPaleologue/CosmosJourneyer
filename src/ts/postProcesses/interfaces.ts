import { Color3, Matrix, Quaternion, Texture, Vector3 } from "@babylonjs/core";

export enum ShaderDataType {
    Auto,
    Float,
    Vector3,
    Color3,
    Matrix,
    Quaternion,
    Texture,
}

export type shaderData = number | Vector3 | Color3 | Matrix | Quaternion | Texture;

export interface ShaderData<shaderData> {
    name: string;
    type: ShaderDataType;
    get: () => shaderData;
}

export type ShaderUniforms = ShaderData<shaderData>[];
export type ShaderSamplers = ShaderData<shaderData>[];
