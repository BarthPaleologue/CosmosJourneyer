"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["9217"],{45208:function(e,r,o){o.r(r),o.d(r,{depthBoxBlurPixelShader:()=>i});var l=o(38700);let t="depthBoxBlurPixelShader",S=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec2 screenSize;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 colorDepth=vec4(0.0);for (int x=-OFFSET; x<=OFFSET; x++)
for (int y=-OFFSET; y<=OFFSET; y++)
colorDepth+=texture2D(textureSampler,vUV+vec2(x,y)/screenSize);gl_FragColor=(colorDepth/float((OFFSET*2+1)*(OFFSET*2+1)));}`;l.l.ShadersStore[t]||(l.l.ShadersStore[t]=S);let i={name:t,shader:S}}}]);