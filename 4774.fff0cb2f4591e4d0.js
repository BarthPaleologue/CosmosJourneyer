"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["4774"],{34079:function(e,t,i){i.r(t),i.d(t,{hdrFilteringVertexShaderWGSL:()=>u});var r=i(66755);let n="hdrFilteringVertexShader",o=`attribute position: vec2f;varying direction: vec3f;uniform up: vec3f;uniform right: vec3f;uniform front: vec3f;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
var view: mat3x3f= mat3x3f(uniforms.up,uniforms.right,uniforms.front);vertexOutputs.direction=view*vec3f(input.position,1.0);vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;r.v.ShadersStoreWGSL[n]||(r.v.ShadersStoreWGSL[n]=o);let u={name:n,shader:o}}}]);