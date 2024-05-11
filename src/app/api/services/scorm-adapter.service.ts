import {Injectable} from '@angular/core';
import {UserService} from './user.service';
import API_URL from 'src/app/config/constants/apiURL';
import {Task, ScormDataModel, ScormPlayerContext} from 'src/app/api/models/doubtfire-model';

@Injectable({
  providedIn: 'root',
})
export class ScormAdapterService {
  private readonly apiBaseUrl = `${API_URL}/test_attempts`;
  private dataModel: ScormDataModel;
  private context: ScormPlayerContext;
  private xhr: XMLHttpRequest;

  constructor(private userService: UserService) {
    this.dataModel = new ScormDataModel();
    this.context = new ScormPlayerContext(this.userService.currentUser);
    this.xhr = new XMLHttpRequest();
  }

  set task(task: Task) {
    this.context.task = task;
  }

  get state() {
    return this.context.state;
  }

  destroy() {
    this.dataModel = new ScormDataModel();
    this.context.state = 'Uninitialized';
  }

  Initialize(): string {
    console.log('API_1484_11: Initialize');

    // TODO: error handling and reporting
    switch (this.context.state) {
      case 'Initialized':
        this.context.errorCode = 103;
        console.log('Already Initialized');
        break;
      case 'Terminated':
        this.context.errorCode = 104;
        console.log('Content Instance Terminated');
        break;
    }

    // TODO: move this part into the player component
    this.xhr.open('GET', `${this.apiBaseUrl}/${this.context.task.id}/latest`, false);

    let noTestFound = false;
    let startNewTest = false;

    this.xhr.onload = () => {
      if (this.xhr.status >= 200 && this.xhr.status < 400) {
        console.log('Retrieved the latest attempt.');
      } else if (this.xhr.status == 404) {
        console.log('Not found.');
        noTestFound = true;
      } else {
        console.error('Error saving DataModel:', this.xhr.responseText);
      }
    };

    this.xhr.send();
    console.log(this.xhr.responseText);

    if (!noTestFound) {
      const latestSession = JSON.parse(this.xhr.responseText);
      console.log('Latest exam session:', latestSession);
      this.context.attemptId = latestSession.id;
      if (latestSession.completion_status) {
        startNewTest = true;
      }
    } else {
      startNewTest = true;
    }

    if (!startNewTest) {
      this.xhr.open(
        'PATCH',
        `${this.apiBaseUrl}/${this.context.task.id}/session/${this.context.attemptId}`,
        false,
      );
      this.xhr.send();
      console.log(this.xhr.responseText);

      const currentSession = JSON.parse(this.xhr.responseText);
      console.log('Current exam session:', currentSession);
      this.context.attemptId = currentSession.id;
      this.dataModel.restore(currentSession.cmi_datamodel);
      console.log(this.dataModel.dump());
    } else {
      this.xhr.open('POST', `${this.apiBaseUrl}/${this.context.task.id}/session`, false);
      this.xhr.send();
      console.log(this.xhr.responseText);

      const currentSession = JSON.parse(this.xhr.responseText);
      console.log('Current exam session:', currentSession);
      this.context.attemptId = currentSession.id;
      this.dataModel.restore(currentSession.cmi_datamodel);
      console.log(this.dataModel.dump());
    }

    this.context.state = 'Initialized';
    return 'true';
  }

  Terminate(): string {
    console.log('API_1484_11: Terminate');

    // TODO: error handling and reporting
    switch (this.context.state) {
      case 'Uninitialized':
        this.context.errorCode = 112;
        console.log('Termination Before Initialization');
        break;
      case 'Terminated':
        this.context.errorCode = 113;
        console.log('Termination After Termination');
        break;
    }

    this.xhr.open(
      'PATCH',
      `${this.apiBaseUrl}/${this.context.task.id}/session/${this.context.attemptId}`,
      false,
    );
    this.xhr.setRequestHeader('Content-Type', 'application/json');
    const requestData = {
      terminated: true,
    };
    this.xhr.send(JSON.stringify(requestData));
    console.log(this.xhr.responseText);

    // all done, clearing datamodel and setting state to terminated
    this.dataModel = new ScormDataModel();
    this.context.state = 'Terminated';
    return 'true';
  }

  GetValue(element: string): string {
    const value = this.dataModel.get(element);

    // TODO: error reporting
    // TODO: can't get until init is done
    switch (this.context.state) {
      case 'Uninitialized':
        this.context.errorCode = 122;
        console.log('Retrieve Data Before Initialization');
        break;
      case 'Terminated':
        this.context.errorCode = 123;
        console.log('Retrieve Data After Termination');
        break;
    }

    console.log(`API_1484_11: GetValue:`, element, value);
    return value;
  }

  SetValue(element: string, value: any): string {
    console.log(`API_1484_11: SetValue:`, element, value);

    // TODO: error reporting
    // TODO: can't set until init is done
    switch (this.context.state) {
      case 'Uninitialized':
        this.context.errorCode = 132;
        console.log('Store Data Before Initialization');
        break;
      case 'Terminated':
        this.context.errorCode = 133;
        console.log('Store Data After Termination');
        break;
    }

    this.dataModel.set(element, value);
    return 'true';
  }

  Commit(): string {
    console.log('API_1484_11: Commit');

    // TODO: error reporting
    // TODO: can't commit until init is done
    switch (this.context.state) {
      case 'Uninitialized':
        this.context.errorCode = 142;
        console.log('Commit Before Initialization');
        break;
      case 'Terminated':
        this.context.errorCode = 143;
        console.log('Commit After Termination');
        break;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(
      'PATCH',
      `${this.apiBaseUrl}/${this.context.task.id}/session/${this.context.attemptId}`,
      true,
    );
    xhr.setRequestHeader('Content-Type', 'application/json');
    const requestData = {
      cmi_datamodel: JSON.stringify(this.dataModel.dump()),
    };
    xhr.send(JSON.stringify(requestData));

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

    this.context.errorCode = 0;
    return 'true';
  }

  GetLastError(): string {
    const lastError = this.context.errorCode.toString();
    if (lastError !== '0') {
      console.log(`API_1484_11: GetLastError: ${lastError}`);
    }
    return lastError;
  }

  GetErrorString(errorCode: string): string {
    const errorString = this.context.getErrorMessage(errorCode);
    console.log(`API_1484_11: GetErrorString:`, errorCode, errorString);
    return errorString;
  }

  GetDiagnostic(errorCode: string): string {
    // TODO: implement this
    console.log(`API_1484_11: GetDiagnostic:`, errorCode);
    return 'GetDiagnostic is currently not implemented';
  }
}
