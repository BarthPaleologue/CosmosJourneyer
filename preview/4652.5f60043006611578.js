"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["4652"],{94695(e,t,r){r.r(t),r.d(t,{glowMapMergeVertexShaderWGSL:()=>i});var n=r(17984);let o="glowMapMergeVertexShader",a=`attribute position: vec2f;varying vUV: vec2f;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vUV=input.position*madd+madd;vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;n.l.ShadersStoreWGSL[o]||(n.l.ShadersStoreWGSL[o]=a);let i={name:o,shader:a}}}]);