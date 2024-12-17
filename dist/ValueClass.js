"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueClass = void 0;
class ValueClass {
    constructor(name) {
        this.name = name;
    }
    getName() {
        return (this.name);
    }
}
exports.ValueClass = ValueClass;
ValueClass.inrange = new ValueClass('inrange');
ValueClass.high = new ValueClass('high');
ValueClass.low = new ValueClass('low');
ValueClass.last = new ValueClass('last');
