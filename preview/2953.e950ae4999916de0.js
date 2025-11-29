"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["2953"],{93152:function(e,r,o){o.r(r),o.d(r,{extractHighlightsPixelShader:()=>i});var l=o(68415);o(34450);let a="extractHighlightsPixelShader",t=`#include<helperFunctions>
varying vec2 vUV;uniform sampler2D textureSampler;uniform float threshold;uniform float exposure;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);float luma=dot(LuminanceEncodeApprox,gl_FragColor.rgb*exposure);gl_FragColor.rgb=step(threshold,luma)*gl_FragColor.rgb;}`;l.l.ShadersStore[a]||(l.l.ShadersStore[a]=t);let i={name:a,shader:t}}}]);