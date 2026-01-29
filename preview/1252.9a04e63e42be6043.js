"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["1252"],{49071(e,r,o){o.r(r),o.d(r,{rgbdDecodePixelShader:()=>i});var a=o(56863);o(56754);let l="rgbdDecodePixelShader",d=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=vec4(fromRGBD(texture2D(textureSampler,vUV)),1.0);}`;a.l.ShadersStore[l]||(a.l.ShadersStore[l]=d);let i={name:l,shader:d}}}]);