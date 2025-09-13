"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["6623"],{54114:function(e,r,a){a.r(r),a.d(r,{passPixelShader:()=>t});var o=a(38700);let s="passPixelShader",l=`varying vec2 vUV;uniform sampler2D textureSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);}`;o.l.ShadersStore[s]||(o.l.ShadersStore[s]=l);let t={name:s,shader:l}}}]);