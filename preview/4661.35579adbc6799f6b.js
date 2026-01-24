"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["4661"],{34516(e,r,o){o.r(r),o.d(r,{rgbdEncodePixelShader:()=>d});var a=o(77948);o(41007);let l="rgbdEncodePixelShader",t=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=toRGBD(texture2D(textureSampler,vUV).rgb);}`;a.l.ShadersStore[l]||(a.l.ShadersStore[l]=t);let d={name:l,shader:t}}}]);