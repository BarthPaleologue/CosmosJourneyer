"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["1126"],{5954:function(e,r,t){var n=t(68415);let l="kernelBlurVaryingDeclaration";n.l.IncludesShadersStoreWGSL[l]||(n.l.IncludesShadersStoreWGSL[l]="varying sampleCoord{X}: vec2f;")},45160:function(e,r,t){var n=t(68415);let l="kernelBlurVertex";n.l.IncludesShadersStoreWGSL[l]||(n.l.IncludesShadersStoreWGSL[l]="vertexOutputs.sampleCoord{X}=vertexOutputs.sampleCenter+uniforms.delta*KERNEL_OFFSET{X};")},12981:function(e,r,t){t.r(r),t.d(r,{kernelBlurVertexShaderWGSL:()=>u});var n=t(68415);t(5954),t(45160);let l="kernelBlurVertexShader",a=`attribute position: vec2f;uniform delta: vec2f;varying sampleCenter: vec2f;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.sampleCenter=(input.position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;n.l.ShadersStoreWGSL[l]||(n.l.ShadersStoreWGSL[l]=a);let u={name:l,shader:a}}}]);