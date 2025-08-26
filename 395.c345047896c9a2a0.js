"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["395"],{35066:function(e,r,a){a.r(r),a.d(r,{passPixelShader:()=>t});var o=a(66755);let s="passPixelShader",l=`varying vec2 vUV;uniform sampler2D textureSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);}`;o.v.ShadersStore[s]||(o.v.ShadersStore[s]=l);let t={name:s,shader:l}}}]);