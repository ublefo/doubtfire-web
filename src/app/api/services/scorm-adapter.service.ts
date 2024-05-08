import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';
import API_URL from 'src/app/config/constants/apiURL';
import { Task, ScormDataModel, ScormPlayerContext } from 'src/app/api/models/doubtfire-model';

@Injectable({
  providedIn: 'root'
})
export class ScormAdapterService {
  private readonly apiBaseUrl = `${API_URL}/test_attempts`;
  private dataModel: ScormDataModel;
  private playerContext: ScormPlayerContext;

  initializationComplete$ = new BehaviorSubject<boolean>(false);

  private scormErrorCodes: {[key: string]: string} = {
    '0': 'No Error',
    '101': 'General Exception',
    '102': 'General Initialization Failure',
    '103': 'Already Initialized',
    '104': 'Content Instance Terminated',
    '111': 'General Termination Failure',
    '112': 'Termination Before Initialization',
    '113': 'Termination After Termination',
    '122': 'Retrieve Data Before Initialization',
    '123': 'Retrieve Data After Termination',
    '132': 'Store Data Before Initialization',
    '133': 'Store Data After Termination',
    '142': 'Commit Before Initialization',
    '143': 'Commit After Termination',
    '201': 'General Argument Error',
    '301': 'General Get Failure',
    '351': 'General Set Failure',
    '391': 'General Commit Failure',
    '401': 'Undefined Data Model Element',
    '402': 'Unimplemented Data Model Element',
    '403': 'Data Model Element Value Not Initialized',
    '404': 'Data Model Element Is Read Only',
    '405': 'Data Model Element Is Write Only',
    '406': 'Data Model Element Type Mismatch',
    '407': 'Data Model Element Value Out Of Range',
    '408': 'Data Model Dependency Not Established',
  };

  constructor(private userService: UserService) {
    this.dataModel = new ScormDataModel();
    this.playerContext = new ScormPlayerContext(this.userService.currentUser);
  }

  setTask(task: Task) {
    this.playerContext.setTask(task);
  }

  // getDefaultDataStore() {
  //   // Use spread operator to merge defaultValues into the dataStore
  //   return {
  //     ...this.defaultValues,
  //     pass_status: false,
  //     completed: false,
  //   };
  // }

  Initialize(mode: 'attempt' | 'review' = 'attempt'): string {
    console.log('Initialize() function called');
    const xhr = new XMLHttpRequest();
    if (mode === 'review') {
      this.SetValue('cmi.mode', 'review');

      xhr.open(
        'GET',
        `${this.apiBaseUrl}/completed-latest?task_id=${this.playerContext.task.id}`,
        false,
      );
      xhr.send();
      console.log(xhr.responseText);

      if (xhr.status !== 200) {
        console.error('Error fetching latest completed test result:', xhr.statusText);
        return 'false';
      }

      try {
        const completedTest = JSON.parse(xhr.responseText);
        const parsedDataModel = JSON.parse(completedTest.data.suspend_data ?? '{}');

        // Set entire suspendData string to cmi.suspend_data
        this.SetValue('cmi.suspend_data', JSON.stringify(parsedDataModel));

        // // Use SetValue to set parsedSuspendData values to dataStore
        // Object.keys(parsedDataModel).forEach((key) => {
        //   this.SetValue(key, parsedDataModel[key]);
        // });

        this.dataModel.restore(parsedDataModel);

        this.SetValue('cmi.entry', 'RO');
        this.SetValue('cmi.mode', 'review');

        console.log('Latest completed test data:', completedTest);
        return 'true';
      } catch (error) {
        console.error('Error:', error);
        return 'false';
      }
    }

    xhr.open('GET', `${this.apiBaseUrl}/latest?task_id=${this.playerContext.task.id}`, false);
    xhr.send();
    console.log(xhr.responseText);

    if (xhr.status !== 200) {
      console.error('Error fetching latest test result:', xhr.statusText);
      return 'false';
    }

    let latestTest;
    try {
      latestTest = JSON.parse(xhr.responseText);
      console.log('Latest test result:', latestTest);
      this.playerContext.attemptId = latestTest.data.id;

      if (latestTest.data['cmi_entry'] === 'ab-initio') {
        console.log('starting new test');
        this.dataModel.init();
        this.SetValue('cmi.learner_id', this.playerContext.learnerId);
        this.SetValue('cmi.learner_name', this.playerContext.learnerName);

        this.dataModel.set('attempt_number', latestTest.data['attempt_number']);
        console.log(this.dataModel.dump());
      } else if (latestTest.data['cmi_entry'] === 'resume') {
        console.log('resuming test');
        const restoredDataModel = JSON.parse(latestTest.data.suspend_data ?? '{}');
        this.dataModel.restore(JSON.parse(JSON.stringify(restoredDataModel)));

        console.log(this.dataModel.dump());
      }

      this.initializationComplete$.next(true);

      console.log('finished initializing');
      return 'true';
    } catch (error) {
      console.error('Error:', error);
      return 'false';
    }
  }

  // isTestCompleted(): boolean {
  //   return this.dataModel.get('completed') ?? false;
  // }

  Terminate(): string {
    console.log('Terminate Called');
    const examResult = this.dataModel.get('cmi.score.raw');
    const status = this.dataModel.get('cmi.success_status');
    this.dataModel.set('completed', true);
    const currentAttemptNumber = this.dataModel.get('attempt_number') ?? 0;
    const ExamName = this.dataModel.get('name');
    this.dataModel.set('cmi.entry', 'RO');
    const cmientry = this.dataModel.get('cmi.entry');
    const data = {
      name: ExamName,
      attempt_number: currentAttemptNumber,
      pass_status: status === 'passed',
      suspend_data: JSON.stringify(this.dataModel.dump()),
      completed: true,
      exam_result: examResult,
      cmi_entry: cmientry,
      task_id: this.playerContext.task.id
    };

    const xhr = new XMLHttpRequest();
    if (this.playerContext.attemptId) {
      xhr.open('PUT', `${this.apiBaseUrl}/${this.playerContext.attemptId}`, false);
    } else {
      xhr.open('POST', this.apiBaseUrl, false);
    }
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.send(JSON.stringify(data));

    if (xhr.status !== 200) {
      console.error('Error sending test data:', xhr.statusText);
      return 'false';
    }
    this.dataModel.init();
    return 'true';
  }

  GetValue(element: string): string {
    const value = this.dataModel.get(element);
    console.log(`GetValue:`, element, value);
    return value;
  }

  SetValue(element: string, value: any): string {
    console.log(`SetValue:`, element, value);
    this.dataModel.set(element, value);
    return 'true';
  }

  // Saves the state of the exam.
  Commit(): string {
    if (!this.initializationComplete$.getValue()) {
      console.warn('Initialization not complete. Cannot commit.');
      return 'false';
    }

    // Set cmi.entry to 'resume' before committing dataStore
    this.dataModel.set('cmi.entry', 'resume');
    // if (!this.isTestCompleted()) {
    //   this.dataModel.set('cmi.exit', 'suspend');
    // }
    console.log('Committing DataModel:', this.dataModel.dump());

    // Use XHR to send the request
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${this.apiBaseUrl}/${this.playerContext.attemptId}/suspend`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 400) {
        console.log('DataModel saved successfully.');
      } else {
        console.error('Error saving DataModel:', xhr.responseText);
      }
    };

    xhr.onerror = () => {
      console.error('Request failed.');
    };

    const requestData = { suspend_data: this.dataModel.dump() };
    xhr.send(JSON.stringify(requestData));
    return 'true';
  }

  // Placeholder methods for SCORM error handling
  GetLastError(): string {
    //console.log('Get Last Error called');
    return "0";
  }

  GetErrorString(errorCode: string): string {
    return '';
  }

  GetDiagnostic(errorCode: string): string {
    //console.log('Get Diagnoistic called');
    return '';
  }
}
