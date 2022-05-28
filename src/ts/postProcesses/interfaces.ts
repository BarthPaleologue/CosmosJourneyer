import { Color3 } from "@babylonjs/core";

export interface AtmosphereSettings {
    atmosphereRadius: number;
    falloffFactor: number;
    intensity: number;
    rayleighStrength: number;
    mieStrength: number;
    densityModifier: number;
    redWaveLength: number;
    greenWaveLength: number;
    blueWaveLength: number;
    mieHaloRadius: number;
}

export interface CloudSettings {
    cloudLayerRadius: number;
    smoothness: number;
    specularPower: number;
    cloudFrequency: number;
    cloudDetailFrequency: number;
    cloudPower: number;
    cloudSharpness: number;
    cloudColor: Color3;
    worleySpeed: number;
    detailSpeed: number;
}

export interface VolumetricCloudSettings {
    atmosphereRadius: number;
}

export interface OceanSettings {
    oceanRadius: number;
    smoothness: number;
    specularPower: number;
    depthModifier: number;
    alphaModifier: number;
    waveBlendingSharpness: number;
}

export interface RingsSettings {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
}

export interface StarfieldSettings {}

export enum ShaderDataType {
    Auto,
    Float,
    Vector3,
    Color3,
    Matrix,
    Quaternion,
    Texture,
    FloatArray
}

interface ShaderData {
    type: ShaderDataType;
    get: () => {};
}

export interface CShaderData<T> extends ShaderData {
    get: () => T;
}

export type ShaderUniformData = { [uniformName: string]: ShaderData };
export type ShaderSamplerData = { [samplerName: string]: ShaderData };
