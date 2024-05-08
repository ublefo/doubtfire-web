import { Task, User } from 'src/app/api/models/doubtfire-model';

export class ScormPlayerContext {
  task: Task;
  mode: 'browse' | 'normal' | 'review';
  user: User;
  attemptNumber: number;
  attemptId: number;
  learnerName: string;
  learnerId: number;

  constructor(user: User) {
    this.user = user;
    this.learnerId = user.id;
    this.learnerName = user.firstName + ' ' + user.lastName;
  }

  public setTask(task: Task): void {
    this.task = task;
  }

  public setMode(mode: 'browse' | 'normal' | 'review'): void {
    this.mode = mode;
  }

  public setAttemptNumber(attemptNumber: number = 1): void {
    this.attemptNumber = attemptNumber;
  }

  public setAttemptId(attemptId: number): void {
    this.attemptId = attemptId;
  }
}
