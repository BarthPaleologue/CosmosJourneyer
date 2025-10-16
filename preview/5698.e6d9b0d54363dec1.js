"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["5698"],{3273:function(e,i,r){r.r(i),r.d(i,{hdrIrradianceFilteringVertexShader:()=>a});var o=r(29416);let n="hdrIrradianceFilteringVertexShader",t=`attribute vec2 position;varying vec3 direction;uniform vec3 up;uniform vec3 right;uniform vec3 front;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
mat3 view=mat3(up,right,front);direction=view*vec3(position,1.0);gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;o.l.ShadersStore[n]||(o.l.ShadersStore[n]=t);let a={name:n,shader:t}}}]);