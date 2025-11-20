"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["5289"],{37104:function(e,r,i){i.r(r),i.d(r,{hdrFilteringPixelShader:()=>a});var n=i(28345);i(61244),i(5258),i(82542),i(3120);let l="hdrFilteringPixelShader",o=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform float alphaG;uniform samplerCube inputTexture;uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=radiance(alphaG,inputTexture,direction,vFilteringInfo);gl_FragColor=vec4(color*hdrScale,1.0);}`;n.l.ShadersStore[l]||(n.l.ShadersStore[l]=o);let a={name:l,shader:o}}}]);