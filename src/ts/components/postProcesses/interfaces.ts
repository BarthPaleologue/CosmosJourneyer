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
    cloudLayerRadius: number,
    smoothness: number,
    specularPower: number,
    cloudFrequency: number,
    cloudDetailFrequency: number,
    cloudPower: number,
    worleySpeed: number,
    detailSpeed: number,
}

export interface VolumetricCloudSettings {
    atmosphereRadius: number;
}

export interface OceanSettings {
    oceanRadius: number,
    smoothness: number,
    specularPower: number,
    depthModifier: number,
    alphaModifier: number,
}

export interface RingsSettings {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
}

export interface StarfieldSettings {

}

export enum ShaderDataType {
    Auto,
    Float,
    Vector3,
    Matrix,
    Texture,
}

interface ShaderData {
    type: ShaderDataType;
    get: () => {};
}

export interface CShaderData<T> extends ShaderData {
    get: () => T;
}

export type ShaderUniformData = {[uniformName: string]: ShaderData};
export type ShaderSamplerData = {[samplerName: string]: ShaderData};