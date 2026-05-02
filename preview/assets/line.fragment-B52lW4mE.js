import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./clipPlaneFragmentDeclaration-Cu2zO80O.js";import{t as i}from"./logDepthDeclaration-DJNNTDCh.js";import{t as a}from"./logDepthFragment-BpBWNd0L.js";import{n as o}from"./clipPlaneFragment-ZzQwUm06.js";var s,c,l,u=e((()=>{t(),r(),i(),a(),o(),s=`linePixelShader`,c=`#include<clipPlaneFragmentDeclaration>
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