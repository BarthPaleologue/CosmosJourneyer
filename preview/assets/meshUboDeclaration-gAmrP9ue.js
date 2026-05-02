import{t as e}from"./shaderStore-DV7KRD9j.js";const t=`sceneUboDeclaration`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=`layout(std140,column_major) uniform;uniform Scene {mat4 viewProjection;
#ifdef MULTIVIEW
mat4 viewProjectionR;
#endif 
mat4 view;mat4 projection;vec4 vEyePosition;};
`);const n=`meshUboDeclaration`;e.IncludesShadersStore[n]||(e.IncludesShadersStore[n]=`#ifdef WEBGL2
uniform mat4 world;uniform float visibility;
#else
layout(std140,column_major) uniform;uniform Mesh
{mat4 world;float visibility;};
#endif
#define WORLD_UBO
`);