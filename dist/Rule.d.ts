import { ControlValue } from './ControlValue';
import { ValueClass } from './ValueClass';
export declare class Rule {
    name: string;
    triggerPath: string;
    lowThreshold: number;
    highThreshold: number;
    controlPath: string;
    inRangeControlValue: ControlValue;
    lowTransitControlValue: ControlValue;
    highTransitControlValue: ControlValue;
    lastControlValue: ControlValue;
    constructor(options: any);
    getControlValue(valueClass: ValueClass): ControlValue;
}
