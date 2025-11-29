"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["4141"],{54700:function(e,l,n){n.r(l),n.d(l,{linePixelShader:()=>r});var i=n(68415);n(71531),n(20142),n(88040),n(32887);let o="linePixelShader",a=`#include<clipPlaneFragmentDeclaration>
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
}`;i.l.ShadersStore[o]||(i.l.ShadersStore[o]=a);let r={name:o,shader:a}}}]);