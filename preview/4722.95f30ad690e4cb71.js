"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["4722"],{26140(e,r,l){var a=l(77948);let n="kernelBlurVaryingDeclaration";a.l.IncludesShadersStore[n]||(a.l.IncludesShadersStore[n]="varying vec2 sampleCoord{X};")},24121(e,r,l){l.r(r),l.d(r,{kernelBlurVertexShader:()=>d});var a=l(77948);l(26140);let n="kernelBlurVertex";a.l.IncludesShadersStore[n]||(a.l.IncludesShadersStore[n]="sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};");let o="kernelBlurVertexShader",t=`attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
sampleCenter=(position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;a.l.ShadersStore[o]||(a.l.ShadersStore[o]=t);let d={name:o,shader:t}}}]);