import{n as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shaderStore-C5hmi3ce.js";import{n as r}from"./clipPlaneFragmentDeclaration-D0hY0OO_.js";import{t as i}from"./logDepthDeclaration-Cetoi_e5.js";import{t as a}from"./logDepthFragment-DDbBKOLs.js";import{n as o}from"./clipPlaneFragment-BhiqKtwF.js";var s,c,l,u=e((()=>{t(),r(),i(),a(),o(),s=`linePixelShader`,c=`#include<clipPlaneFragmentDeclaration>
uniform color: vec4f;
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<logDepthFragment>
#include<clipPlaneFragment>
fragmentOutputs.color=uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`,n.ShadersStoreWGSL[s]||(n.ShadersStoreWGSL[s]=c),l={name:s,shader:c}}));export{l as n,u as t};
//# sourceMappingURL=line.fragment-BQSywwBy.js.map