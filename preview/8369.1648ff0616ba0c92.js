"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["8369"],{36792(e,r,a){a.r(r),a.d(r,{passPixelShaderWGSL:()=>u});var t=a(56863);let l="passPixelShader",s=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);}`;t.l.ShadersStoreWGSL[l]||(t.l.ShadersStoreWGSL[l]=s);let u={name:l,shader:s}}}]);