"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["9118"],{18689:function(e,r,t){var n=t(38700);let l="kernelBlurVaryingDeclaration";n.l.IncludesShadersStoreWGSL[l]||(n.l.IncludesShadersStoreWGSL[l]="varying sampleCoord{X}: vec2f;")},72253:function(e,r,t){t.r(r),t.d(r,{kernelBlurVertexShaderWGSL:()=>s});var n=t(38700);t(18689);let l="kernelBlurVertex";n.l.IncludesShadersStoreWGSL[l]||(n.l.IncludesShadersStoreWGSL[l]="vertexOutputs.sampleCoord{X}=vertexOutputs.sampleCenter+uniforms.delta*KERNEL_OFFSET{X};");let a="kernelBlurVertexShader",u=`attribute position: vec2f;uniform delta: vec2f;varying sampleCenter: vec2f;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.sampleCenter=(input.position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;n.l.ShadersStoreWGSL[a]||(n.l.ShadersStoreWGSL[a]=u);let s={name:a,shader:u}}}]);