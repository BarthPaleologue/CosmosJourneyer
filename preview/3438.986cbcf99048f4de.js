"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["3438"],{93917(e,r,t){t.r(r),t.d(r,{screenSpaceCurvaturePixelShaderWGSL:()=>o});var a=t(17984);let l="screenSpaceCurvaturePixelShader",u=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;var normalSampler: texture_2d<f32>;uniform curvature_ridge: f32;uniform curvature_valley: f32;
#ifndef CURVATURE_OFFSET
#define CURVATURE_OFFSET 1
#endif
fn curvature_soft_clamp(curvature: f32,control: f32)->f32
{if (curvature<0.5/control) {return curvature*(1.0-curvature*control);}
return 0.25/control;}
fn calculate_curvature(texel: vec2i,ridge: f32,valley: f32)->f32
{let normal_up =textureLoad(normalSampler,texel+vec2i(0, CURVATURE_OFFSET),0).rb;let normal_down =textureLoad(normalSampler,texel+vec2i(0,-CURVATURE_OFFSET),0).rb;let normal_left =textureLoad(normalSampler,texel+vec2i(-CURVATURE_OFFSET,0),0).rb;let normal_right=textureLoad(normalSampler,texel+vec2i( CURVATURE_OFFSET,0),0).rb;let normal_diff=((normal_up.g-normal_down.g)+(normal_right.r-normal_left.r));if (normal_diff<0.0) {return -2.0*curvature_soft_clamp(-normal_diff,valley);}
return 2.0*curvature_soft_clamp(normal_diff,ridge);}
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs
{let texel=vec2i(fragmentInputs.position.xy);let baseColor=textureSample(textureSampler,textureSamplerSampler,fragmentInputs.vUV);let curvature=calculate_curvature(texel,uniforms.curvature_ridge,uniforms.curvature_valley);fragmentOutputs.color=vec4f(baseColor.rgb*(curvature+1.0),baseColor.a);}
`;a.l.ShadersStoreWGSL[l]||(a.l.ShadersStoreWGSL[l]=u);let o={name:l,shader:u}}}]);