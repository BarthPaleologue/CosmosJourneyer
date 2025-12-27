"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["3206"],{18325(e,r,o){o.r(r),o.d(r,{extractHighlightsPixelShader:()=>g});var l=o(17984);o(68595);let a="extractHighlightsPixelShader",t=`#include<helperFunctions>
varying vec2 vUV;uniform sampler2D textureSampler;uniform float threshold;uniform float exposure;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);float luma=dot(LuminanceEncodeApprox,gl_FragColor.rgb*exposure);gl_FragColor.rgb=step(threshold,luma)*gl_FragColor.rgb;}`;l.l.ShadersStore[a]||(l.l.ShadersStore[a]=t);let g={name:a,shader:t}}}]);