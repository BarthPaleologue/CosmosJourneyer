"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["587"],{73446(e,r,t){t.r(r),t.d(r,{rgbdDecodePixelShaderWGSL:()=>m});var a=t(56863);t(75185);let l="rgbdDecodePixelShader",u=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(fromRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV)),1.0);}`;a.l.ShadersStoreWGSL[l]||(a.l.ShadersStoreWGSL[l]=u);let m={name:l,shader:u}}}]);