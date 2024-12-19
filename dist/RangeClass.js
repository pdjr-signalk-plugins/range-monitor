"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeClass = void 0;
class RangeClass {
    constructor(name) {
        this.name = name;
    }
    getName() {
        return (this.name);
    }
}
exports.RangeClass = RangeClass;
RangeClass.inrange = new RangeClass('inrange');
RangeClass.high = new RangeClass('high');
RangeClass.low = new RangeClass('low');
