"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["7704"],{61067(e,l,n){n.r(l),n.d(l,{linePixelShader:()=>r});var i=n(17984);n(67888),n(29343),n(87235),n(13030);let a="linePixelShader",o=`#include<clipPlaneFragmentDeclaration>
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