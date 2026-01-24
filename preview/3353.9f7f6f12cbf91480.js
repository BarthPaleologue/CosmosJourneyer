"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["3353"],{54176(e,r,i){i.r(r),i.d(r,{hdrIrradianceFilteringVertexShaderWGSL:()=>u});var t=i(77948);let n="hdrIrradianceFilteringVertexShader",o=`attribute position: vec2f;varying direction: vec3f;uniform up: vec3f;uniform right: vec3f;uniform front: vec3f;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
var view: mat3x3f= mat3x3f(uniforms.up,uniforms.right,uniforms.front);vertexOutputs.direction=view*vec3f(input.position,1.0);vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.l.ShadersStoreWGSL[n]||(t.l.ShadersStoreWGSL[n]=o);let u={name:n,shader:o}}}]);