import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";var r,i,a=e((()=>{t(),r=`sceneUboDeclaration`,i=`layout(std140,column_major) uniform;uniform Scene {mat4 viewProjection;
#ifdef MULTIVIEW
mat4 viewProjectionR;
#endif 
mat4 view;mat4 projection;vec4 vEyePosition;};
`,n.IncludesShadersStore[r]||(n.IncludesShadersStore[r]=i)}));export{a as t};