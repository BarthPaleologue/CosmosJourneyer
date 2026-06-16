import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./clipPlaneFragmentDeclaration-BjnOaHEy.js";import{n as i}from"./fogFragmentDeclaration-CUdxThAV.js";import{t as a}from"./fogFragment-DyC7Abjg.js";import{n as o}from"./clipPlaneFragment-BDIjmn0N.js";var s,c,l,u=e((()=>{t(),r(),i(),o(),a(),s=`colorPixelShader`,c=`#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
#define VERTEXCOLOR
varying vec4 vColor;
#else
uniform vec4 color;
#endif
#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
gl_FragColor=vColor;
#else
gl_FragColor=color;
#endif
#include<fogFragment>(color,gl_FragColor)
#define CUSTOM_FRAGMENT_MAIN_END
}`,n.ShadersStore[s]||(n.ShadersStore[s]=c),l={name:s,shader:c}}));export{u as n,l as t};
//# sourceMappingURL=color.fragment-B4oK28Jm.js.map