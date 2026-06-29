import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{t as r}from"./boundingBoxRendererUboDeclaration-DUTKu7ir.js";var i,a,o=e((()=>{t(),i=`boundingBoxRendererFragmentDeclaration`,a=`uniform vec4 color;
`,n.IncludesShadersStore[i]||(n.IncludesShadersStore[i]=a)})),s,c,l,u=e((()=>{t(),o(),r(),s=`boundingBoxRendererPixelShader`,c=`#include<__decl__boundingBoxRendererFragment>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`,n.ShadersStore[s]||(n.ShadersStore[s]=c),l={name:s,shader:c}}));export{u as n,l as t};
//# sourceMappingURL=boundingBoxRenderer.fragment-B-ve6icX.js.map