"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
const ControlValue_1 = require("./ControlValue");
const ValueClass_1 = require("./ValueClass");
class Rule {
    constructor(options) {
        this.name = '';
        this.triggerPath = '';
        this.lowThreshold = 0;
        this.highThreshold = 0;
        this.controlPath = '';
        this.inRangeControlValue = ControlValue_1.ControlValue.undefined;
        this.lowTransitControlValue = ControlValue_1.ControlValue.undefined;
        this.highTransitControlValue = ControlValue_1.ControlValue.undefined;
        this.lastControlValue = ControlValue_1.ControlValue.undefined;
        if (!options.triggerPath)
            throw new Error('missing \'triggerPath\' property');
        if (!options.lowThreshold)
            throw new Error('missing \'lowThreshold\' property');
        if (!options.highThreshold)
            throw new Error('missing \'highThreshold\' property');
        this.name = options.name || 'innominate';
        this.triggerPath = options.triggerPath;
        this.controlPath = options.controlPath || `notifications.${options.triggerPath}`;
        this.lowThreshold = options.lowThreshold;
        this.highThreshold = options.highThreshold;
        this.inRangeControlValue = (options.inRangeControlValue) ? new ControlValue_1.ControlValue(options.inRangeControlValue) : ControlValue_1.ControlValue.undefined,
            this.lowTransitControlValue = (options.lowTransitControlValue) ? new ControlValue_1.ControlValue(options.lowTransitControlValue) : ControlValue_1.ControlValue.undefined,
            this.highTransitControlValue = (options.highTransitControlValue) ? new ControlValue_1.ControlValue(options.highTransitControlValue) : ControlValue_1.ControlValue.undefined,
            this.lastControlValue = ControlValue_1.ControlValue.undefined;
    }
    getControlValue(valueClass) {
        switch (valueClass) {
            case ValueClass_1.ValueClass.inrange: return (this.inRangeControlValue);
            case ValueClass_1.ValueClass.low: return (this.lowTransitControlValue);
            case ValueClass_1.ValueClass.high: return (this.highTransitControlValue);
        }
        return (ControlValue_1.ControlValue.undefined);
    }
}
exports.Rule = Rule;
