import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{n as r}from"./clipPlaneFragmentDeclaration-CGv-zJDR.js";import{t as i}from"./logDepthDeclaration-X9NIsbEa.js";import{t as a}from"./logDepthFragment-BUsG7qsx.js";import{n as o}from"./clipPlaneFragment-BvAeYP_6.js";var s,c,l,u=e((()=>{t(),r(),i(),o(),a(),s=`outlinePixelShader`,c=`#ifdef LOGARITHMICDEPTH
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
//# sourceMappingURL=outline.fragment-CERoIzIG.js.map