import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";var r,i,a,o=e((()=>{t(),r=`iblVoxelGridPixelShader`,i=`var voxel_storage: texture_storage_3d<rgba8unorm,write>;varying vNormalizedPosition: vec3f;flat varying f_swizzle: i32;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var size: vec3f=vec3f(textureDimensions(voxel_storage));var normPos: vec3f=input.vNormalizedPosition.xyz;var outputColor: vec4f=vec4f(0.0,0.0,0.0,1.0);switch (input.f_swizzle) {case 0: {normPos=normPos.zxy; 
outputColor=vec4f(1.0,1.0,0.0,1.0);break;}
case 1: {normPos=normPos.yzx;outputColor=vec4f(1.0,1.0,1.0,1.0);break;}
default: {normPos=normPos.xyz;outputColor=vec4f(1.0,1.0,0.0,1.0);break;}}
textureStore(voxel_storage,vec3<i32>(i32(normPos.x*size.x),i32(normPos.y*size.y),i32(normPos.z*size.z)),outputColor);fragmentOutputs.color=vec4<f32>(vec3<f32>(normPos),1.);}`,n.ShadersStoreWGSL[r]||(n.ShadersStoreWGSL[r]=i),a={name:r,shader:i}}));export{o as n,a as t};
//# sourceMappingURL=iblVoxelGrid.fragment-CJ7_BvG6.js.map