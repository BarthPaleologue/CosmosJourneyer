import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";import{n as r}from"./helperFunctions-Dv88wD2h.js";import{t as i}from"./pbrBRDFFunctions-VhVcK8yq.js";import{n as a,t as o}from"./hdrFilteringFunctions-Bt0Z2iiv.js";var s,c,l,u=e((()=>{t(),r(),a(),i(),o(),s=`hdrIrradianceFilteringPixelShader`,c=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform samplerCube inputTexture;
#ifdef IBL_CDF_FILTERING
uniform sampler2D icdfTexture;
#endif
uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=irradiance(inputTexture,direction,vFilteringInfo,0.0,vec3(1.0),direction
#ifdef IBL_CDF_FILTERING
,icdfTexture
#endif
);gl_FragColor=vec4(color*hdrScale,1.0);}`,n.ShadersStore[s]||(n.ShadersStore[s]=c),l={name:s,shader:c}}));export{u as n,l as t};
//# sourceMappingURL=hdrIrradianceFiltering.fragment-CIvwNQ0L.js.map