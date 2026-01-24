"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["4246"],{67493(e,r,t){t.r(r),t.d(r,{rgbdEncodePixelShaderWGSL:()=>n});var a=t(77948);t(22636);let l="rgbdEncodePixelShader",u=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=toRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb);}`;a.l.ShadersStoreWGSL[l]||(a.l.ShadersStoreWGSL[l]=u);let n={name:l,shader:u}}}]);