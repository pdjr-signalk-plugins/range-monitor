export class Range {

  private name: string;

  static inrange = new Range('inrange');
  static high = new Range('high');
  static low = new Range('low');

  constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return(this.name);
  }

}