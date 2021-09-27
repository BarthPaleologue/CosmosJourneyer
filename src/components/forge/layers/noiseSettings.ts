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
    amplitudeModifier: number,
    frequencyModifier: number,
    minValueModifier: number,
    offsetModifier: number[];

    /**
     * Facteur de dispersion des continents : 1=îlots ; 2=tout accidenté
     */
    archipelagoFactor: number;
}