"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["6335"],{89458:function(e,r,o){o.r(r),o.d(r,{extractHighlightsPixelShader:()=>i});var l=o(34981);o(13384);let a="extractHighlightsPixelShader",t=`#include<helperFunctions>
varying vec2 vUV;uniform sampler2D textureSampler;uniform float threshold;uniform float exposure;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);float luma=dot(LuminanceEncodeApprox,gl_FragColor.rgb*exposure);gl_FragColor.rgb=step(threshold,luma)*gl_FragColor.rgb;}`;l.l.ShadersStore[a]||(l.l.ShadersStore[a]=t);let i={name:a,shader:t}}}]);