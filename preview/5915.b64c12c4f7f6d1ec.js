"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["5915"],{29094(e,n,l){l.r(n),l.d(n,{linePixelShaderWGSL:()=>i});var r=l(77948);l(98997),l(84444),l(12194),l(82589);let a="linePixelShader",t=`#include<clipPlaneFragmentDeclaration>
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