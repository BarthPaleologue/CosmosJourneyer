import{t as e}from"./shaderStore-D-XQlhUT.js";const t=`passPixelShader`,n=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);}`;e.ShadersStoreWGSL[t]||(e.ShadersStoreWGSL[t]=n);const r={name:t,shader:n};export{r as passPixelShaderWGSL};
//# sourceMappingURL=pass.fragment-CQOd4vYi.js.map