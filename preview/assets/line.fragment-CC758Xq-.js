import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./clipPlaneFragmentDeclaration-BjnOaHEy.js";import{t as i}from"./logDepthDeclaration-CePzDkyG.js";import{t as a}from"./logDepthFragment-DrsGQlzY.js";import{n as o}from"./clipPlaneFragment-BDIjmn0N.js";var s,c,l,u=e((()=>{t(),r(),i(),a(),o(),s=`linePixelShader`,c=`#include<clipPlaneFragmentDeclaration>
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
}`,n.ShadersStore[s]||(n.ShadersStore[s]=c),l={name:s,shader:c}}));export{l as n,u as t};
//# sourceMappingURL=line.fragment-CC758Xq-.js.map