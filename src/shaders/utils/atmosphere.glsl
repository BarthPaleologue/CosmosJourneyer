struct Atmosphere {
    float radius;// atmosphere radius (calculate from planet center)
    float falloff;// controls exponential opacity falloff
    float sunIntensity;// controls atmosphere overall brightness
    float rayleighStrength;// controls color dispersion
    float mieStrength;// controls mie scattering
    float densityModifier;// density of the atmosphere
    float redWaveLength;// the wave length for the red part of the scattering
    float greenWaveLength;// same with green
    float blueWaveLength;// same with blue
    float mieHaloRadius;// mie halo radius
};
uniform Atmosphere atmosphere;

#pragma glslify: export(atmosphere)