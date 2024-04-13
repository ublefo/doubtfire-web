import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NumbasComponent } from './numbas-component.component';
import { Task } from 'src/app/api/models/task';

@Injectable({
  providedIn: 'root',
})
export class NumbasModal {
  constructor(public dialog: MatDialog) { }
  
  public show(task: Task, mode: 'attempt' | 'review'): void {
    let dialogRef: MatDialogRef<NumbasComponent, any>;

    dialogRef = this.dialog.open(NumbasComponent, {
      data: { task, mode },
      width: '95%', height: '90%'
    });
  }
}
