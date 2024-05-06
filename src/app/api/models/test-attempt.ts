import { Entity } from "ngx-entity-service";
import { Task } from "./task";

export class TestAttempt extends Entity {
  public id: number;
  name: string;
  attemptNumber: number;
  passStatus: boolean;
  suspendData: string;
  completed: boolean;
  cmiEntry: string;
  examResult: string;
  attemptedAt: Date;
  taskId: number;

  task: Task;

  constructor(task: Task) {
    super();
    this.task = task;
  }
}
