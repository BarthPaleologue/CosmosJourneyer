import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./helperFunctions-DxRVZtIm.js";import{t as i}from"./pbrBRDFFunctions--PgSGUtK.js";import{n as a,t as o}from"./hdrFilteringFunctions-BX7YdAMA.js";var s,c,l,u=e((()=>{t(),r(),a(),i(),o(),s=`hdrIrradianceFilteringPixelShader`,c=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
var inputTextureSampler: sampler;var inputTexture: texture_cube<f32>;
#ifdef IBL_CDF_FILTERING
var icdfTextureSampler: sampler;var icdfTexture: texture_2d<f32>;
#endif
uniform vFilteringInfo: vec2f;uniform hdrScale: f32;varying direction: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=irradiance(inputTexture,inputTextureSampler,input.direction,uniforms.vFilteringInfo,0.0,vec3f(1.0),input.direction
#ifdef IBL_CDF_FILTERING
,icdfTexture,icdfTextureSampler
#endif
);fragmentOutputs.color= vec4f(color*uniforms.hdrScale,1.0);}`,n.ShadersStoreWGSL[s]||(n.ShadersStoreWGSL[s]=c),l={name:s,shader:c}}));export{u as n,l as t};
//# sourceMappingURL=hdrIrradianceFiltering.fragment-BmbFg37V.js.map