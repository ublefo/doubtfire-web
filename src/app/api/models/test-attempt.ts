import { Entity } from "ngx-entity-service";

export class TestAttempt extends Entity {
  id: number;
  name: string;
  attemptNumber: number;
  passStatus: boolean;
  examData: string;
  completed: boolean;
  cmiEntry: string;
  examResult: string;
  attemptedAt: Date;
  associatedTaskId: number;
}
