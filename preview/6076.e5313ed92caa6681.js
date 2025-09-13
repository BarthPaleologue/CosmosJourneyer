"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["6076"],{20135:function(e,r,t){t.r(r),t.d(r,{passPixelShaderWGSL:()=>s});var a=t(38700);let u="passPixelShader",l=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);}`;a.l.ShadersStoreWGSL[u]||(a.l.ShadersStoreWGSL[u]=l);let s={name:u,shader:l}}}]);