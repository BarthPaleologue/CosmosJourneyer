"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["762"],{85921:function(e,r,i){i.r(r),i.d(r,{hdrFilteringPixelShader:()=>a});var n=i(29416);i(47291),i(2327),i(57607),i(17555);let l="hdrFilteringPixelShader",o=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform float alphaG;uniform samplerCube inputTexture;uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=radiance(alphaG,inputTexture,direction,vFilteringInfo);gl_FragColor=vec4(color*hdrScale,1.0);}`;n.l.ShadersStore[l]||(n.l.ShadersStore[l]=o);let a={name:l,shader:o}}}]);