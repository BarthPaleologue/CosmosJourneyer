The `@babylonjs/core` patch exposes a texture type on
`VolumetricLightScatteringPostProcess` for its scene input and internal scattering
render target, and preserves HDR sampler precision in its GLSL shader. The game
selects half-float so this pass does not quantize linear scene colors to 8 bits.

Remove the patch when a Babylon release provides this configuration natively.
