"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["6473"],{59136(e,r,i){i.r(r),i.d(r,{hdrIrradianceFilteringPixelShader:()=>l});var n=i(56863);i(56754),i(12228),i(20920),i(37598);let o="hdrIrradianceFilteringPixelShader",c=`#include<helperFunctions>
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