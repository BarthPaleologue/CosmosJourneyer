import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./helperFunctions-DxRVZtIm.js";var i,a,o,s=e((()=>{t(),r(),i=`rgbdEncodePixelShader`,a=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=toRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb);}`,n.ShadersStoreWGSL[i]||(n.ShadersStoreWGSL[i]=a),o={name:i,shader:a}}));export{o as n,s as t};
//# sourceMappingURL=rgbdEncode.fragment-a9Tg5hhK.js.map