"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["395"],{14214:function(e,o,i){i.r(o),i.d(o,{glowMapMergeVertexShader:()=>d});var a=i(29416);let r="glowMapMergeVertexShader",t=`attribute vec2 position;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;a.l.ShadersStore[r]||(a.l.ShadersStore[r]=t);let d={name:r,shader:t}}}]);