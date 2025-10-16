"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["1300"],{45279:function(e,t,r){r.r(t),r.d(t,{glowMapMergeVertexShaderWGSL:()=>a});var n=r(29416);let o="glowMapMergeVertexShader",i=`attribute position: vec2f;varying vUV: vec2f;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vUV=input.position*madd+madd;vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;n.l.ShadersStoreWGSL[o]||(n.l.ShadersStoreWGSL[o]=i);let a={name:o,shader:i}}}]);