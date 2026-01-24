"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["6487"],{41290(e,o,a){a.r(o),a.d(o,{glowMapMergeVertexShader:()=>s});var i=a(77948);let r="glowMapMergeVertexShader",d=`attribute vec2 position;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;i.l.ShadersStore[r]||(i.l.ShadersStore[r]=d);let s={name:r,shader:d}}}]);