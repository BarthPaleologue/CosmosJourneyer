import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{n as r}from"./helperFunctions-BXzvP9TY.js";var i,a,o,s=e((()=>{t(),r(),i=`extractHighlightsPixelShader`,a=`#include<helperFunctions>
varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform threshold: f32;uniform exposure: f32;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);var luma: f32=dot(LuminanceEncodeApprox,fragmentOutputs.color.rgb*uniforms.exposure);fragmentOutputs.color=vec4f(step(uniforms.threshold,luma)*fragmentOutputs.color.rgb,fragmentOutputs.color.a);}`,n.ShadersStoreWGSL[i]||(n.ShadersStoreWGSL[i]=a),o={name:i,shader:a}}));export{s as n,o as t};
//# sourceMappingURL=extractHighlights.fragment-CqtOdvYn.js.map