import { Injectable } from "@angular/core";
import { EntityService } from "ngx-entity-service";
import { TestAttempt } from "../models/test-attempt";
import { HttpClient } from "@angular/common/http";
import API_URL from "src/app/config/constants/apiURL";
import { Task } from "../models/task";
import { Observable } from "rxjs";
import { AppInjector } from "src/app/app-injector";
import { DoubtfireConstants } from "src/app/config/constants/doubtfire-constants";

@Injectable()
export class TestAttemptService extends EntityService<TestAttempt> {
  protected readonly endpointFormat = '/test_attempts?id=:id:';

  constructor(httpClient: HttpClient) {
    super(httpClient, API_URL);

    this.mapping.addKeys(
      'id',
      'name',
      'attemptNumber',
      'passStatus',
      'suspendData',
      'completed',
      'cmiEntry',
      'examResult',
      'attemptedAt',
      'taskId'
    );
  }

  public createInstanceFrom(json: object, other?: any): TestAttempt {
    return new TestAttempt(other as Task);
  }

  public getLatestCompletedTestAttempt(task: Task): Observable<TestAttempt> {
    const url = `${AppInjector.get(DoubtfireConstants).API_URL}/test_attempts/completed-latest?task_id=${task.id}`;
    return AppInjector.get(HttpClient).get<TestAttempt>(url);
  }
}