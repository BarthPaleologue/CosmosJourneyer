"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["890"],{72481(e,o,i){i.r(o),i.d(o,{proceduralVertexShader:()=>t});var r=i(56863);let a="proceduralVertexShader",s=`attribute vec2 position;varying vec2 vPosition;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vPosition=position;vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;r.l.ShadersStore[a]||(r.l.ShadersStore[a]=s);let t={name:a,shader:s}}}]);