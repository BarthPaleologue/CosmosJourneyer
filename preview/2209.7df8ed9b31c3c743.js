"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["2209"],{34643:function(e,r,n){var l=n(68415);let a="kernelBlurVaryingDeclaration";l.l.IncludesShadersStore[a]||(l.l.IncludesShadersStore[a]="varying vec2 sampleCoord{X};")},54185:function(e,r,n){var l=n(68415);let a="kernelBlurVertex";l.l.IncludesShadersStore[a]||(l.l.IncludesShadersStore[a]="sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};")},74392:function(e,r,n){n.r(r),n.d(r,{kernelBlurVertexShader:()=>t});var l=n(68415);n(34643),n(54185);let a="kernelBlurVertexShader",o=`attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
sampleCenter=(position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;l.l.ShadersStore[a]||(l.l.ShadersStore[a]=o);let t={name:a,shader:o}}}]);