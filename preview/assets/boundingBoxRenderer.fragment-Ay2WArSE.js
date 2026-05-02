import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{t as r}from"./boundingBoxRendererUboDeclaration-DgKTJLxW.js";var i,a,o=e((()=>{t(),i=`boundingBoxRendererFragmentDeclaration`,a=`uniform vec4 color;
`,n.IncludesShadersStore[i]||(n.IncludesShadersStore[i]=a)})),s,c,l,u=e((()=>{t(),o(),r(),s=`boundingBoxRendererPixelShader`,c=`#include<__decl__boundingBoxRendererFragment>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`,n.ShadersStore[s]||(n.ShadersStore[s]=c),l={name:s,shader:c}}));export{u as n,l as t};