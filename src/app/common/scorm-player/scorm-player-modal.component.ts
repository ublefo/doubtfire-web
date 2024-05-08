import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ScormPlayerComponent } from './scorm-player.component';
import { Task } from 'src/app/api/models/task';

@Injectable({
  providedIn: 'root',
})
export class ScormPlayerModal {
  constructor(public dialog: MatDialog) { }

  public show(task: Task, mode: 'attempt' | 'review'): void {
    let dialogRef: MatDialogRef<ScormPlayerComponent, any>;

    dialogRef = this.dialog.open(ScormPlayerComponent, {
      data: { task, mode },
      width: '95%', height: '90%'
    });
  }
}
