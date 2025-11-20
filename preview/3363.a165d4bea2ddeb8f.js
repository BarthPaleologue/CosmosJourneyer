"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["3363"],{57182:function(e,i,r){r.r(i),r.d(i,{hdrFilteringVertexShader:()=>a});var o=r(28345);let t="hdrFilteringVertexShader",n=`attribute vec2 position;varying vec3 direction;uniform vec3 up;uniform vec3 right;uniform vec3 front;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
mat3 view=mat3(up,right,front);direction=view*vec3(position,1.0);gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;o.l.ShadersStore[t]||(o.l.ShadersStore[t]=n);let a={name:t,shader:n}}}]);