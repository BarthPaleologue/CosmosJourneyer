"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["1554"],{34685:function(e,t,i){i.r(t),i.d(t,{proceduralVertexShaderWGSL:()=>s});var n=i(80709);let o="proceduralVertexShader",r=`attribute position: vec2f;varying vPosition: vec2f;varying vUV: vec2f;const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vPosition=input.position;vertexOutputs.vUV=input.position*madd+madd;vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;n.v.ShadersStoreWGSL[o]||(n.v.ShadersStoreWGSL[o]=r);let s={name:o,shader:r}}}]);