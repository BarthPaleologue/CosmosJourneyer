"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["2468"],{29183:function(e,i,r){r.r(i),r.d(i,{hdrIrradianceFilteringPixelShader:()=>l});var n=r(29416);r(47291),r(2327),r(57607),r(17555);let o="hdrIrradianceFilteringPixelShader",c=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform samplerCube inputTexture;
#ifdef IBL_CDF_FILTERING
uniform sampler2D icdfTexture;
#endif
uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=irradiance(inputTexture,direction,vFilteringInfo,0.0,vec3(1.0),direction
#ifdef IBL_CDF_FILTERING
,icdfTexture
#endif
);gl_FragColor=vec4(color*hdrScale,1.0);}`;n.l.ShadersStore[o]||(n.l.ShadersStore[o]=c);let l={name:o,shader:c}}}]);