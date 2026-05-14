import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./clipPlaneFragmentDeclaration-ZydEbf85.js";import{t as i}from"./logDepthDeclaration-CBgNGOLC.js";import{t as a}from"./logDepthFragment-BDez7JpP.js";import{n as o}from"./clipPlaneFragment-De5LTEwJ.js";var s,c,l,u=e((()=>{t(),r(),i(),o(),a(),s=`outlinePixelShader`,c=`#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
uniform vec4 color;
#ifdef ALPHATEST
varying vec2 vUV;uniform sampler2D diffuseSampler;
#endif
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#ifdef ALPHATEST
if (texture2D(diffuseSampler,vUV).a<0.4)
discard;
#endif
#include<logDepthFragment>
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`,n.ShadersStore[s]||(n.ShadersStore[s]=c),l={name:s,shader:c}}));export{l as n,u as t};
//# sourceMappingURL=outline.fragment-DEVk9Se1.js.map