export interface NoiseSettings {
    noiseStrength: number,
    baseAmplitude: number,
    baseFrequency: number,
    minValue: number,
    offset: number[],
    octaves: number,
    decay: number,
    useCraterMask: boolean,
}

export interface NoiseModifiers {
    strengthModifier: number,
    amplitudeModifier: number,
    frequencyModifier: number,
    minValueModifier: number,
    offsetModifier: number[];
}