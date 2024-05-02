import {Component, Inject, LOCALE_ID} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {alertService} from 'src/app/ajs-upgraded-providers';
import {TaskComment, TaskCommentService, Task} from 'src/app/api/models/doubtfire-model';
import {AppInjector} from 'src/app/app-injector';
import {FormControl, Validators, FormGroup, FormGroupDirective, NgForm} from '@angular/forms';
import {MatDatepickerInputEvent} from '@angular/material/datepicker';
import {differenceInWeeks, differenceInDays, isAfter, addDays} from 'date-fns';
import {ErrorStateMatcher} from '@angular/material/core';

/** Error when invalid control is dirty, touched, or submitted. */
export class ReasonErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'extension-modal',
  templateUrl: './extension-modal.component.html',
})
export class ExtensionModalComponent {
  protected reasonMinLength: number = 15;
  protected reasonMaxLength: number = 256;
  constructor(
    public dialogRef: MatDialogRef<ExtensionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {task: Task; afterApplication?: () => void},
    @Inject(alertService) private alerts: any,
  ) {}

  matcher = new ReasonErrorStateMatcher();
  currentLocale = AppInjector.get(LOCALE_ID);
  extensionData = new FormGroup({
    extensionReason: new FormControl('', [
      Validators.required,
      Validators.minLength(this.reasonMinLength),
      Validators.maxLength(this.reasonMaxLength),
    ]),
  });

  get extensionDuration(): number {
    // calculating the number of days between now and the requested date
    return differenceInDays(this.extensionDate, this.data.task.localDueDate()) + 1;
  }

  // minimum date is due date if before target date, current date if after target date
  minDate = new Date(
    addDays(
      isAfter(Date.now(), this.data.task.localDueDate())
        ? new Date()
        : this.data.task.localDueDate(),
      1,
    ),
  );
  maxDate = this.data.task.localDeadlineDate(); // deadline, hard deadline
  extensionDate = new Date(this.minDate);
  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    this.extensionDate = new Date(event.value);
  }

  private scrollCommentsDown(): void {
    setTimeout(() => {
      const objDiv = document.querySelector('div.comments-body');
      // let wrappedResult = angular.element(objDiv);
      objDiv.scrollTop = objDiv.scrollHeight;
    }, 50);
  }

  submitApplication() {
    const tcs: TaskCommentService = AppInjector.get(TaskCommentService);
    tcs
      .requestExtension(
        this.extensionData.controls.extensionReason.value,
        this.extensionDuration,
        this.data.task,
      )
      .subscribe({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        next: ((tc: TaskComment) => {
          this.alerts.add('success', 'Extension requested.', 2000);
          this.scrollCommentsDown();
          if (typeof this.data.afterApplication === 'function') {
            this.data.afterApplication();
          }
        }).bind(this),

        error: ((response: never) => {
          this.alerts.add('danger', 'Error requesting extension ' + response);
        }).bind(this),
      });
  }
}
