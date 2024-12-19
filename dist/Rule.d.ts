import { ControlValue } from './ControlValue';
import { RangeClass } from './RangeClass';
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
    getControlValue(rangeClass: RangeClass): ControlValue;
}
