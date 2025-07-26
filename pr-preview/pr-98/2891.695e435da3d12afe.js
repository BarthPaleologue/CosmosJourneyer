"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["2891"],{23277:function(e,o,i){i.r(o),i.d(o,{proceduralVertexShader:()=>s});var r=i(80709);let n="proceduralVertexShader",t=`attribute vec2 position;varying vec2 vPosition;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vPosition=position;vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;r.v.ShadersStore[n]||(r.v.ShadersStore[n]=t);let s={name:n,shader:t}}}]);