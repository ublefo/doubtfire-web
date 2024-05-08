export class ScormDataModel {
  initState: {[key: string]: string} = {
    'cmi.completion_status': 'not attempted',
    'cmi.entry': 'ab-initio',
    'cmi.objectives._count': '0',
    'cmi.interactions._count': '0',
    'cmi.mode': 'normal',
  };

  dataModel: {[key: string]: any} = {};
  readonly msgPrefix = 'SCORM DataModel: ';

  constructor() {
    this.dataModel = {};
  }

  public init() {
    console.log(this.msgPrefix + 'initializing DataModel with default values');
    this.dataModel = this.initState;
  }

  public restore(dataModel: {[key: string]: any} = {}) {
    console.log(this.msgPrefix + 'restoring DataModel with provided data');
    this.dataModel = dataModel;
  }

  public get(key: string): string {
    return this.dataModel[key] ?? '';
  }

  public dump(): {[key: string]: any} {
    return this.dataModel;
  }

  public set(key: string, value: any): string {
    console.log(this.msgPrefix + 'set: ', key, value);
    this.dataModel[key] = value;
    if (key.match('cmi.interactions.\\d+.id')) {
      const interactionPath = key.match('cmi.interactions.\\d+');
      const objectivesCounterForInteraction = interactionPath.toString() + '.objectives._count';
      console.log('Incrementing cmi.interactions._count');
      this.dataModel['cmi.interactions._count']++;
      console.log(`Initializing ${objectivesCounterForInteraction}`);
      this.dataModel[objectivesCounterForInteraction] = 0;
    }
    if (key.match('cmi.interactions.\\d+.objectives.\\d+.id')) {
      const interactionPath = key.match('cmi.interactions.\\d+.objectives');
      const objectivesCounterForInteraction = interactionPath.toString() + '._count';
      console.log(`Incrementing ${objectivesCounterForInteraction}`);
      this.dataModel[objectivesCounterForInteraction.toString()]++;
    }
    if (key.match('cmi.objectives.\\d+.id')) {
      console.log('Incrementing cmi.objectives._count');
      this.dataModel['cmi.objectives._count']++;
    }
    return 'true';
  }
}
