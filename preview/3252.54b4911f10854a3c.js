"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["3252"],{28812:function(e,r,n){var l=n(38700);let a="kernelBlurVaryingDeclaration";l.l.IncludesShadersStore[a]||(l.l.IncludesShadersStore[a]="varying vec2 sampleCoord{X};")},42479:function(e,r,n){n.r(r),n.d(r,{kernelBlurVertexShader:()=>d});var l=n(38700);n(28812);let a="kernelBlurVertex";l.l.IncludesShadersStore[a]||(l.l.IncludesShadersStore[a]="sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};");let o="kernelBlurVertexShader",t=`attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
sampleCenter=(position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;l.l.ShadersStore[o]||(l.l.ShadersStore[o]=t);let d={name:o,shader:t}}}]);