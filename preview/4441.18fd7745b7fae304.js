"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["4441"],{84258:function(e,r,o){o.r(r),o.d(r,{extractHighlightsPixelShader:()=>i});var l=o(66755);o(95277);let t="extractHighlightsPixelShader",a=`#include<helperFunctions>
varying vec2 vUV;uniform sampler2D textureSampler;uniform float threshold;uniform float exposure;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);float luma=dot(LuminanceEncodeApprox,gl_FragColor.rgb*exposure);gl_FragColor.rgb=step(threshold,luma)*gl_FragColor.rgb;}`;l.v.ShadersStore[t]||(l.v.ShadersStore[t]=a);let i={name:t,shader:a}}}]);