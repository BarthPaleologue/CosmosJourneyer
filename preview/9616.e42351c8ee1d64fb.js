"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["9616"],{40695:function(e,i,r){r.r(i),r.d(i,{hdrFilteringVertexShader:()=>c});var o=r(66755);let t="hdrFilteringVertexShader",n=`attribute vec2 position;varying vec3 direction;uniform vec3 up;uniform vec3 right;uniform vec3 front;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
mat3 view=mat3(up,right,front);direction=view*vec3(position,1.0);gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;o.v.ShadersStore[t]||(o.v.ShadersStore[t]=n);let c={name:t,shader:n}}}]);