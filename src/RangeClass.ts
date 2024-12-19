export class RangeClass {

  private name: string;

  static inrange = new RangeClass('inrange');
  static high = new RangeClass('high');
  static low = new RangeClass('low');

  constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return(this.name);
  }

}