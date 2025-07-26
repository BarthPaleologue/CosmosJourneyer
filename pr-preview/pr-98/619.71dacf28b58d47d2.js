"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["619"],{79627:function(e,t,s){s.r(t),s.d(t,{postprocessVertexShaderWGSL:()=>i});var r=s(80709);let o="postprocessVertexShader",n=`attribute position: vec2<f32>;uniform scale: vec2<f32>;varying vUV: vec2<f32>;const madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vUV=(vertexInputs.position*madd+madd)*uniforms.scale;vertexOutputs.position=vec4(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}
`;r.v.ShadersStoreWGSL[o]||(r.v.ShadersStoreWGSL[o]=n);let i={name:o,shader:n}}}]);