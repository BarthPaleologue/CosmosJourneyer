import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";var r,i,a=e((()=>{t(),r=`sceneUboDeclaration`,i=`struct Scene {viewProjection : mat4x4<f32>,
#ifdef MULTIVIEW
viewProjectionR : mat4x4<f32>,
#endif 
view : mat4x4<f32>,
projection : mat4x4<f32>,
vEyePosition : vec4<f32>,};
#define SCENE_UBO
var<uniform> scene : Scene;
`,n.IncludesShadersStoreWGSL[r]||(n.IncludesShadersStoreWGSL[r]=i)}));export{a as t};