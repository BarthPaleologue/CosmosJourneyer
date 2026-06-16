import{t as e}from"./shaderStore-D-XQlhUT.js";import"./helperFunctions-ClToIjNL.js";const t=`rgbdEncodePixelShader`;e.ShadersStoreWGSL[t]||(e.ShadersStoreWGSL[t]=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=toRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb);}`);
//# sourceMappingURL=rgbdEncode.fragment-DhuFyAnH.js.map