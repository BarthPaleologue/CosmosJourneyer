"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["6715"],{17110:function(e,r,t){t.r(r),t.d(r,{passPixelShaderWGSL:()=>s});var a=t(34981);let u="passPixelShader",l=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);}`;a.l.ShadersStoreWGSL[u]||(a.l.ShadersStoreWGSL[u]=l);let s={name:u,shader:l}}}]);