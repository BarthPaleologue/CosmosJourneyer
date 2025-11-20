"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["110"],{5085:function(e,r,n){n.r(r),n.d(r,{hdrFilteringPixelShaderWGSL:()=>a});var i=n(28345);n(93783),n(72315),n(25651),n(18591);let t="hdrFilteringPixelShader",u=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform alphaG: f32;var inputTextureSampler: sampler;var inputTexture: texture_cube<f32>;uniform vFilteringInfo: vec2f;uniform hdrScale: f32;varying direction: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=radiance(uniforms.alphaG,inputTexture,inputTextureSampler,input.direction,uniforms.vFilteringInfo);fragmentOutputs.color= vec4f(color*uniforms.hdrScale,1.0);}`;i.l.ShadersStoreWGSL[t]||(i.l.ShadersStoreWGSL[t]=u);let a={name:t,shader:u}}}]);