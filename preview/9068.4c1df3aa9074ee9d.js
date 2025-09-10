"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["9068"],{83660:function(e,r,i){i.r(r),i.d(r,{iblCdfyPixelShaderWGSL:()=>t});var o=i(66755);let c="iblCdfyPixelShader",n=`varying vUV : vec2f;
#include <helperFunctions>
#ifdef IBL_USE_CUBE_MAP
var iblSourceSampler: sampler;var iblSource: texture_cube<f32>;
#else
var iblSourceSampler: sampler;var iblSource: texture_2d<f32>;
#endif
uniform iblHeight: i32;
#ifdef IBL_USE_CUBE_MAP
fn fetchCube(uv: vec2f)->f32 {var direction: vec3f=equirectangularToCubemapDirection(uv);return sin(PI*uv.y) *
dot(textureSampleLevel(iblSource,iblSourceSampler,direction,0.0)
.rgb,
LuminanceEncodeApprox);}
#else
fn fetchPanoramic(Coords: vec2i,envmapHeight: f32)->f32 {return sin(PI*(f32(Coords.y)+0.5)/envmapHeight) *
dot(textureLoad(iblSource,Coords,0).rgb,LuminanceEncodeApprox);}
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var coords: vec2i= vec2i(fragmentInputs.position.xy);var cdfy: f32=0.0;for (var y: i32=1; y<=coords.y; y++) {
#ifdef IBL_USE_CUBE_MAP
var uv: vec2f= vec2f(input.vUV.x,( f32(y-1)+0.5)/ f32(uniforms.iblHeight));cdfy+=fetchCube(uv);
#else
cdfy+=fetchPanoramic( vec2i(coords.x,y-1), f32(uniforms.iblHeight));
#endif
}
fragmentOutputs.color= vec4f(cdfy,0.0,0.0,1.0);}`;o.v.ShadersStoreWGSL[c]||(o.v.ShadersStoreWGSL[c]=n);let t={name:c,shader:n}}}]);