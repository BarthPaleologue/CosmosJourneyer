"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["9122"],{81597:function(e,r,t){var n=t(80709);let a="kernelBlurVaryingDeclaration";n.v.IncludesShadersStoreWGSL[a]||(n.v.IncludesShadersStoreWGSL[a]="varying sampleCoord{X}: vec2f;")},54378:function(e,r,t){t.r(r),t.d(r,{kernelBlurVertexShaderWGSL:()=>l});var n=t(80709);t(81597);let a="kernelBlurVertex";n.v.IncludesShadersStoreWGSL[a]||(n.v.IncludesShadersStoreWGSL[a]="vertexOutputs.sampleCoord{X}=vertexOutputs.sampleCenter+uniforms.delta*KERNEL_OFFSET{X};");let u="kernelBlurVertexShader",s=`attribute position: vec2f;uniform delta: vec2f;varying sampleCenter: vec2f;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.sampleCenter=(input.position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;n.v.ShadersStoreWGSL[u]||(n.v.ShadersStoreWGSL[u]=s);let l={name:u,shader:s}}}]);