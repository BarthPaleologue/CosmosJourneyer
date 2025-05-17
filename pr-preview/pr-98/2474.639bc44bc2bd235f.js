"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["2474"],{79852:function(e,o,i){i.r(o),i.d(o,{glowMapMergeVertexShader:()=>d});var r=i(80709);let a="glowMapMergeVertexShader",t=`attribute vec2 position;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;r.v.ShadersStore[a]||(r.v.ShadersStore[a]=t);let d={name:a,shader:t}}}]);