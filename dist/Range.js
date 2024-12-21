"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Range = void 0;
class Range {
    constructor(name) {
        this.name = name;
    }
    getName() {
        return (this.name);
    }
}
exports.Range = Range;
Range.inrange = new Range('inrange');
Range.high = new Range('high');
Range.low = new Range('low');
