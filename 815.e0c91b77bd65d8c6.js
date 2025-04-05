"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["815"],{98532:function(e,r,t){t.r(r),t.d(r,{passPixelShaderWGSL:()=>s});var a=t(19015);let u="passPixelShader",p=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);}`;a.v.ShadersStoreWGSL[u]=p;let s={name:u,shader:p}}}]);