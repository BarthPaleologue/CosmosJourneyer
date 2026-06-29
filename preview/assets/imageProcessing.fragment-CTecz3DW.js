import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{n as r}from"./helperFunctions-BXzvP9TY.js";import{n as i}from"./imageProcessingDeclaration-DRGu3QLq.js";import{n as a}from"./imageProcessingFunctions-DGWIHQqd.js";var o,s,c,l=e((()=>{t(),i(),r(),a(),o=`imageProcessingPixelShader`,s=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<imageProcessingDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var result: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);result=vec4f(max(result.rgb,vec3f(0.)),result.a);
#ifdef IMAGEPROCESSING
#ifndef FROMLINEARSPACE
result=vec4f(toLinearSpaceVec3(result.rgb),result.a);
#endif
result=applyImageProcessing(result);
#else
#ifdef FROMLINEARSPACE
result=applyImageProcessing(result);
#endif
#endif
fragmentOutputs.color=result;}`,n.ShadersStoreWGSL[o]||(n.ShadersStoreWGSL[o]=s),c={name:o,shader:s}}));export{l as n,c as t};
//# sourceMappingURL=imageProcessing.fragment-CTecz3DW.js.map