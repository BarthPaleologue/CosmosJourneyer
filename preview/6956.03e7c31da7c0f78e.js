"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["6956"],{17319(e,l,n){n.r(l),n.d(l,{linePixelShader:()=>r});var i=n(77948);n(18300),n(60243),n(62975),n(42794);let a="linePixelShader",o=`#include<clipPlaneFragmentDeclaration>
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