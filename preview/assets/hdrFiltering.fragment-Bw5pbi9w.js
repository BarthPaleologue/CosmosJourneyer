import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./helperFunctions-DxRVZtIm.js";import{t as i}from"./pbrBRDFFunctions--PgSGUtK.js";import{n as a,t as o}from"./hdrFilteringFunctions-BX7YdAMA.js";var s,c,l,u=e((()=>{t(),r(),a(),i(),o(),s=`hdrFilteringPixelShader`,c=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform alphaG: f32;var inputTextureSampler: sampler;var inputTexture: texture_cube<f32>;uniform vFilteringInfo: vec2f;uniform hdrScale: f32;varying direction: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=radiance(uniforms.alphaG,inputTexture,inputTextureSampler,input.direction,uniforms.vFilteringInfo);fragmentOutputs.color= vec4f(color*uniforms.hdrScale,1.0);}`,n.ShadersStoreWGSL[s]||(n.ShadersStoreWGSL[s]=c),l={name:s,shader:c}}));export{u as n,l as t};
//# sourceMappingURL=hdrFiltering.fragment-Bw5pbi9w.js.map