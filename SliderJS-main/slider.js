export class Slider {
    constructor(_id, _parent, _min, _max, _baseValue, _slide = (val) => { }) {
        this.min = _min;
        this.max = _max;
        this.baseValue = _baseValue;
        this.slide = _slide;
        this.id = _id;
        this.parent = _parent;
        let container = document.createElement("div");
        container.setAttribute("id", `${_id}SliderContainer`);
        container.setAttribute("class", "range-slider");
        this.container = container;
        let handle = document.createElement("span");
        handle.setAttribute("id", `${_id}SliderHandle`);
        handle.setAttribute("class", "rs-label");
        handle.innerHTML = String(_baseValue);
        this.handle = handle;
        container.appendChild(handle);
        let slider = document.createElement("input");
        slider.setAttribute("id", `${_id}Slider`);
        slider.setAttribute("class", "rs-range");
        slider.setAttribute("type", "range");
        slider.setAttribute("value", String(_baseValue));
        slider.setAttribute("min", String(_min));
        slider.setAttribute("max", String(_max));
        this.slider = slider;
        container.appendChild(slider);
        this.parent.appendChild(container);
        slider.addEventListener("input", () => this.update());
        this.slider.value = this.handle.innerHTML;
        let handlePosition = ((this.getValue() - this.min) / (this.max - this.min));
        this.handle.style.marginLeft = handlePosition * (this.slider.offsetWidth - 50) - this.handle.offsetWidth / 2 + "px";
        //this.update();
    }
    increment() {
        this.slider.value = String(this.getValue() + 1);
        this.update();
    }
    decrement() {
        this.slider.value = String(this.getValue() - 1);
        this.update();
    }
    getValue() {
        return parseInt(this.slider.value);
    }
    randomValue() {
        let value = Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
        this.setValue(value);
    }
    setValue(value) {
        this.slider.value = String(value);
        this.update();
    }
    update() {
        this.handle.innerHTML = this.slider.value;
        let handlePosition = ((this.getValue() - this.min) / (this.max - this.min));
        this.handle.style.marginLeft = handlePosition * (this.slider.offsetWidth - 50) - this.handle.offsetWidth / 2 + "px";
        this.slide(parseInt(this.slider.value));
    }
    remove() {
        this.container.remove();
    }
}
