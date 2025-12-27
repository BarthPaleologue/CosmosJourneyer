"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["2895"],{53682(e,n,l){l.r(n),l.d(n,{linePixelShaderWGSL:()=>i});var r=l(17984);l(84033),l(1488),l(15982),l(79009);let a="linePixelShader",t=`#include<clipPlaneFragmentDeclaration>
uniform color: vec4f;
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<logDepthFragment>
#include<clipPlaneFragment>
fragmentOutputs.color=uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;r.l.ShadersStoreWGSL[a]||(r.l.ShadersStoreWGSL[a]=t);let i={name:a,shader:t}}}]);