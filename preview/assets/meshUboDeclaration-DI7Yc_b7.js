import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";var r,i,a=e((()=>{t(),r=`meshUboDeclaration`,i=`#ifdef WEBGL2
uniform mat4 world;uniform float visibility;
#else
layout(std140,column_major) uniform;uniform Mesh
{mat4 world;float visibility;};
#endif
#define WORLD_UBO
`,n.IncludesShadersStore[r]||(n.IncludesShadersStore[r]=i)}));export{a as t};
//# sourceMappingURL=meshUboDeclaration-DI7Yc_b7.js.map