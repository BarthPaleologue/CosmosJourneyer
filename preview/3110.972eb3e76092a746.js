"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["3110"],{95285:function(e,r,n){n.r(r),n.d(r,{hdrFilteringPixelShaderWGSL:()=>a});var i=n(22081);n(41647),n(7779),n(13435),n(62919);let t="hdrFilteringPixelShader",u=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform alphaG: f32;var inputTextureSampler: sampler;var inputTexture: texture_cube<f32>;uniform vFilteringInfo: vec2f;uniform hdrScale: f32;varying direction: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=radiance(uniforms.alphaG,inputTexture,inputTextureSampler,input.direction,uniforms.vFilteringInfo);fragmentOutputs.color= vec4f(color*uniforms.hdrScale,1.0);}`;i.l.ShadersStoreWGSL[t]||(i.l.ShadersStoreWGSL[t]=u);let a={name:t,shader:u}}}]);