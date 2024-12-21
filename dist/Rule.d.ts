import { ControlValue } from './ControlValue';
import { Range } from './Range';
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
    getControlValue(range: Range): ControlValue;
}
