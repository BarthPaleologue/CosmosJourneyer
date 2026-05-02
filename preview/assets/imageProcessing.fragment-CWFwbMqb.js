import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./helperFunctions-CjimQ7bX.js";import{n as i}from"./imageProcessingDeclaration-BFPWNELn.js";import{n as a}from"./imageProcessingFunctions-YoPKD8Ag.js";var o,s,c,l=e((()=>{t(),i(),r(),a(),o=`imageProcessingPixelShader`,s=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
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