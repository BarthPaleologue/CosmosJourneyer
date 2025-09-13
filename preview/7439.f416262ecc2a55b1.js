"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["7439"],{13234:function(r,e,o){o.r(e),o.d(e,{bloomMergePixelShader:()=>u});var l=o(38700);let a="bloomMergePixelShader",t=`uniform sampler2D textureSampler;uniform sampler2D bloomBlur;varying vec2 vUV;uniform float bloomWeight;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{gl_FragColor=texture2D(textureSampler,vUV);vec3 blurred=texture2D(bloomBlur,vUV).rgb;gl_FragColor.rgb=gl_FragColor.rgb+(blurred.rgb*bloomWeight); }
`;l.l.ShadersStore[a]||(l.l.ShadersStore[a]=t);let u={name:a,shader:t}}}]);