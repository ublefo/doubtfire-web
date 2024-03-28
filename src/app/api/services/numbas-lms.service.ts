import { Injectable, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { TaskService } from './task.service';
import { UserService } from './user.service';
import API_URL from 'src/app/config/constants/apiURL';
import { Task } from '../models/task';

declare let pipwerks: any;

@Injectable({
  providedIn: 'root'
})
export class NumbasLmsService {

  private readonly apiBaseUrl = `${API_URL}/test_attempts`;

  private defaultValues: { [key: string]: string } = {
    'cmi.completion_status': 'not attempted',
    'cmi.entry': 'ab-initio',
    'numbas.user_role': 'learner',
    'numbas.duration_extension.units': 'seconds',
    'cmi.mode': 'normal',
    'cmi.undefinedlearner_response': '1',
    'cmi.undefinedresult' : '0'
  };

  private testId: number = 0;
  private taskId: number;
  private learnerId: string;
  initializationComplete$ = new BehaviorSubject<boolean>(false);

  private scormErrors: { [key: string]: string } = {
    "0": "No error",
    "101": "General exception",
  };

  dataStore: { [key: string]: any } = this.getDefaultDataStore();

  constructor(
    private http: HttpClient,
    private taskService: TaskService,
    private userService: UserService
  ) {
    pipwerks.SCORM.version = "2004";
    console.log(`SCORM version is set to: ${pipwerks.SCORM.version}`);
    this.learnerId = this.userService.currentUser.studentId;
  }

  setTask(task: Task) {
    this.taskId = task.id;
  }

  getDefaultDataStore() {
    // Use spread operator to merge defaultValues into the dataStore
    return {
      ...this.defaultValues,
      pass_status: false,
      completed: false,
    };
  }

  Initialize(mode: 'attempt' | 'review' = 'attempt'): string {
    console.log('Initialize() function called');
    const examName = 'test Exam Name 1';
    let xhr = new XMLHttpRequest();
    if (mode === 'review') {
      this.SetValue('cmi.mode', 'review');

      xhr.open("GET", `${this.apiBaseUrl}/completed-latest?task_id=${this.taskId}`, false);
      xhr.send();
      console.log(xhr.responseText);

      if (xhr.status !== 200) {
        console.error('Error fetching latest completed test result:', xhr.statusText);
        return 'false';
      }

      try {
        const completedTest = JSON.parse(xhr.responseText);
        const parsedExamData = JSON.parse(completedTest.data.exam_data || '{}');

        // Set entire suspendData string to cmi.suspend_data
        this.SetValue('cmi.suspend_data', JSON.stringify(parsedExamData));

        // Use SetValue to set parsedExamData values to dataStore
        Object.keys(parsedExamData).forEach(key => {
          this.SetValue(key, parsedExamData[key]);
        });

        this.SetValue('cmi.entry', 'RO');
        this.SetValue('cmi.mode', 'review');

        console.log('Latest completed test data:', completedTest);
        return 'true';
      } catch (error) {
        console.error('Error:', error);
        return 'false';
      }
    }

    xhr.open("GET", `${this.apiBaseUrl}/latest?task_id=${this.taskId}`, false);
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
      this.testId = latestTest.data.id;

      if (latestTest.data['cmi_entry'] === 'ab-initio') {
        console.log("starting new test");
        this.SetValue('cmi.learner_id', this.learnerId);
        this.dataStore['name'] = examName;
        this.dataStore['attempt_number'] = latestTest.data['attempt_number'];
        console.log(this.dataStore);
      } else if (latestTest.data['cmi_entry'] === 'resume') {
        console.log("resuming test");
        const parsedExamData = JSON.parse(latestTest.data.exam_data || '{}');

        this.dataStore = JSON.parse(JSON.stringify(parsedExamData));

        console.log(this.dataStore);
      }

      this.initializationComplete$.next(true);

      console.log("finished initlizing");
      return 'true';
    } catch (error) {
      console.error('Error:', error);
      return 'false';
    }
  }

  isTestCompleted(): boolean {
    return this.dataStore?.['completed'] || false;
  }

  private resetDataStore() {
    this.dataStore = this.getDefaultDataStore();
  }

  Terminate(): string {
    console.log('Terminate Called');
    const examResult = this.dataStore["cmi.score.raw"];
    const status = this.GetValue("cmi.completion_status");
    this.dataStore['completed'] = true;
    const currentAttemptNumber = this.dataStore['attempt_number'] || 0;
    const ExamName = this.dataStore['name'];
    this.SetValue('cmi.entry', 'RO');
    const cmientry = this.GetValue('cmi.entry');
    const data = {
      task_id: this.taskId,
      name: ExamName,
      attempt_number: currentAttemptNumber,
      pass_status: status === 'passed',
      exam_data: JSON.stringify(this.dataStore),
      completed: true,
      exam_result: examResult,
      cmi_entry: cmientry
    };

    const xhr = new XMLHttpRequest();
    if (this.testId) {
      xhr.open("PUT", `${this.apiBaseUrl}/${this.testId}`, false);
    } else {
      xhr.open("POST", this.apiBaseUrl, false);
    }
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));

    if (xhr.status !== 200) {
      console.error('Error sending test data:', xhr.statusText);
      return 'false';
    }
    this.resetDataStore();
    return 'true';
  }

  GetValue(element: string): string {
    return this.dataStore[element] || '';
  }

  SetValue(element: string, value: any): string {
    if (element.startsWith('cmi.')) {
      this.dataStore[element] = value;
    }
    return 'true';
  }

  //function to save the state of the exam.
  Commit(): string {
    if (!this.initializationComplete$.getValue()) {
      console.warn('Initialization not complete. Cannot commit.');
      return 'false';
    }

    // Set cmi.entry to 'resume' before committing dataStore
    this.dataStore['cmi.entry'] = 'resume';
    if (!this.isTestCompleted()) {
      this.dataStore['cmi.exit'] = 'suspend';
    }
    console.log("Committing dataStore:", this.dataStore);

    // Directly stringify the dataStore
    const jsonData = JSON.stringify(this.dataStore);

    // Use XHR to send the request
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${this.apiBaseUrl}/${this.testId}/exam_data`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 400) {
        console.log('Suspend data saved successfully.');
      } else {
        console.error('Error saving suspend data:', xhr.responseText);
      }
    };

    xhr.onerror = () => {
      console.error('Request failed.');
    };

    xhr.send(jsonData);
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
