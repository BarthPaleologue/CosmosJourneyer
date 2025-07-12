"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["3722"],{16355:function(e,r,n){n.r(r),n.d(r,{kernelBlurVertexShader:()=>d});var a=n(66755);n(73785);let l="kernelBlurVertex";a.v.IncludesShadersStore[l]||(a.v.IncludesShadersStore[l]="sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};");let o="kernelBlurVertexShader",t=`attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
sampleCenter=(position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;a.v.ShadersStore[o]||(a.v.ShadersStore[o]=t);let d={name:o,shader:t}},73785:function(e,r,n){var a=n(66755);let l="kernelBlurVaryingDeclaration";a.v.IncludesShadersStore[l]||(a.v.IncludesShadersStore[l]="varying vec2 sampleCoord{X};")}}]);