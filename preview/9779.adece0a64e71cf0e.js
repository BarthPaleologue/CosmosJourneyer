"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["9779"],{50942:function(e,r,i){i.r(r),i.d(r,{hdrFilteringPixelShader:()=>a});var n=i(68415);i(34450),i(7620),i(31896),i(69342);let l="hdrFilteringPixelShader",o=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform float alphaG;uniform samplerCube inputTexture;uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=radiance(alphaG,inputTexture,direction,vFilteringInfo);gl_FragColor=vec4(color*hdrScale,1.0);}`;n.l.ShadersStore[l]||(n.l.ShadersStore[l]=o);let a={name:l,shader:o}}}]);