"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["5085"],{75916(e,l,n){n.r(l),n.d(l,{linePixelShader:()=>r});var i=n(56863);n(8779),n(32654),n(29832),n(64023);let a="linePixelShader",o=`#include<clipPlaneFragmentDeclaration>
uniform vec4 color;
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<logDepthFragment>
#include<clipPlaneFragment>
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;i.l.ShadersStore[a]||(i.l.ShadersStore[a]=o);let r={name:a,shader:o}}}]);