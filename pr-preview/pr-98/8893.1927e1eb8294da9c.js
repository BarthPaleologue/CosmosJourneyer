"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["8893"],{62450:function(e,t,r){r.r(t),r.d(t,{glowMapMergeVertexShaderWGSL:()=>s});var n=r(80709);let o="glowMapMergeVertexShader",i=`attribute position: vec2f;varying vUV: vec2f;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vUV=input.position*madd+madd;vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;n.v.ShadersStoreWGSL[o]||(n.v.ShadersStoreWGSL[o]=i);let s={name:o,shader:i}}}]);