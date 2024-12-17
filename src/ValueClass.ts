export class ValueClass {

  private name: string;

  static inrange = new ValueClass('inrange');
  static high = new ValueClass('high');
  static low = new ValueClass('low');

  constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return(this.name);
  }

}