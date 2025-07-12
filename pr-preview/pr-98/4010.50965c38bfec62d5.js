"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["4010"],{16893:function(e,r,t){t.r(r),t.d(r,{passPixelShaderWGSL:()=>p});var a=t(80709);let u="passPixelShader",s=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);}`;a.v.ShadersStoreWGSL[u]||(a.v.ShadersStoreWGSL[u]=s);let p={name:u,shader:s}}}]);