"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["1448"],{57717(e,r,t){var n=t(17984);let a="kernelBlurVaryingDeclaration";n.l.IncludesShadersStoreWGSL[a]||(n.l.IncludesShadersStoreWGSL[a]="varying sampleCoord{X}: vec2f;")},44939(e,r,t){t.r(r),t.d(r,{kernelBlurVertexShaderWGSL:()=>u});var n=t(17984);t(57717);let a="kernelBlurVertex";n.l.IncludesShadersStoreWGSL[a]||(n.l.IncludesShadersStoreWGSL[a]="vertexOutputs.sampleCoord{X}=vertexOutputs.sampleCenter+uniforms.delta*KERNEL_OFFSET{X};");let l="kernelBlurVertexShader",s=`attribute position: vec2f;uniform delta: vec2f;varying sampleCenter: vec2f;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.sampleCenter=(input.position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;n.l.ShadersStoreWGSL[l]||(n.l.ShadersStoreWGSL[l]=s);let u={name:l,shader:s}}}]);