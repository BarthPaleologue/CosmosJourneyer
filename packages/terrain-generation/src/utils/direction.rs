use wasm_bindgen::prelude::wasm_bindgen;

#[derive(Copy, Clone)]
#[wasm_bindgen]
pub enum Direction {
    Up,
    Down,
    Left,
    Right,
    Forward,
    Backward,
}
