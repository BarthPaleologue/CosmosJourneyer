"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["1424"],{72899(e,r,n){n.r(r),n.d(r,{textureMergerPixelShaderWGSL:()=>f});var u=n(20854);let t="textureMergerPixelShader",a=`#ifdef USE_TEXTURE0
var inputTexture0Sampler: sampler;var inputTexture0: texture_2d<f32>;
#endif
#ifdef USE_TEXTURE1
var inputTexture1Sampler: sampler;var inputTexture1: texture_2d<f32>;
#endif
#ifdef USE_TEXTURE2
var inputTexture2Sampler: sampler;var inputTexture2: texture_2d<f32>;
#endif
#ifdef USE_TEXTURE3
var inputTexture3Sampler: sampler;var inputTexture3: texture_2d<f32>;
#endif
#ifdef RED_FROM_TEXTURE
uniform redTextureIndex: i32;uniform redSourceChannel: i32;
#else
uniform redConstantValue: f32;
#endif
#ifdef GREEN_FROM_TEXTURE
uniform greenTextureIndex: i32;uniform greenSourceChannel: i32;
#else
uniform greenConstantValue: f32;
#endif
#ifdef BLUE_FROM_TEXTURE
uniform blueTextureIndex: i32;uniform blueSourceChannel: i32;
#else
uniform blueConstantValue: f32;
#endif
#ifdef ALPHA_FROM_TEXTURE
uniform alphaTextureIndex: i32;uniform alphaSourceChannel: i32;
#else
uniform alphaConstantValue: f32;
#endif
varying vUV: vec2f;
#if defined(RED_FROM_TEXTURE) || defined(GREEN_FROM_TEXTURE) || defined(BLUE_FROM_TEXTURE) || defined(ALPHA_FROM_TEXTURE)
fn sampleTexture(textureIndex: i32,uv: vec2f)->vec4f {switch (textureIndex) {
#ifdef USE_TEXTURE0
case 0: {return textureSample(inputTexture0,inputTexture0Sampler,uv);}
#endif
#ifdef USE_TEXTURE1
case 1: {return textureSample(inputTexture1,inputTexture1Sampler,uv);}
#endif
#ifdef USE_TEXTURE2
case 2: {return textureSample(inputTexture2,inputTexture2Sampler,uv);}
#endif
#ifdef USE_TEXTURE3
case 3: {return textureSample(inputTexture3,inputTexture3Sampler,uv);}
#endif
default: {return vec4f(0.0,0.0,0.0,1.0); }}}
fn extractChannel(color: vec4f,channelIndex: i32)->f32 {switch (channelIndex) {case 0: {return color.r; }
case 1: {return color.g; }
case 2: {return color.b; }
default: {return color.a; }}}
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let uv: vec2f=input.vUV;
#ifdef RED_FROM_TEXTURE
let redSample: vec4f=sampleTexture(uniforms.redTextureIndex,uv);let r: f32=extractChannel(redSample,uniforms.redSourceChannel);
#else
let r: f32=uniforms.redConstantValue;
#endif
#ifdef GREEN_FROM_TEXTURE
let greenSample: vec4f=sampleTexture(uniforms.greenTextureIndex,uv);let g: f32=extractChannel(greenSample,uniforms.greenSourceChannel);
#else
let g: f32=uniforms.greenConstantValue;
#endif
#ifdef BLUE_FROM_TEXTURE
let blueSample: vec4f=sampleTexture(uniforms.blueTextureIndex,uv);let b: f32=extractChannel(blueSample,uniforms.blueSourceChannel);
#else
let b: f32=uniforms.blueConstantValue;
#endif
#ifdef ALPHA_FROM_TEXTURE
let alphaSample: vec4f=sampleTexture(uniforms.alphaTextureIndex,uv);let a: f32=extractChannel(alphaSample,uniforms.alphaSourceChannel);
#else
let a: f32=uniforms.alphaConstantValue;
#endif
fragmentOutputs.color=vec4f(r,g,b,a);}`;u.l.ShadersStoreWGSL[t]||(u.l.ShadersStoreWGSL[t]=a);let f={name:t,shader:a}}}]);