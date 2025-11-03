use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub struct ReturnData {
    pub nb_instances_created: usize,
    pub average_height: f32,
}
