import{t as e}from"./shaderStore-D-XQlhUT.js";import"./helperFunctions-ClToIjNL.js";const t=`rgbdDecodePixelShader`;e.ShadersStoreWGSL[t]||(e.ShadersStoreWGSL[t]=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(fromRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV)),1.0);}`);
//# sourceMappingURL=rgbdDecode.fragment-QDZYuXEA.js.map