export interface NoiseSettings {
    noiseStrength: number,
    baseAmplitude: number,
    baseFrequency: number,
    minValue: number,
    offset: BABYLON.Vector3,
    octaves: number,
    decay: number,
}

export interface NoiseModifiers {
    strengthModifier: number,
    amplitudeModifier: number,
    frequencyModifier: number,
    minValueModifier: number,
    offsetModifier: BABYLON.Vector3;
}