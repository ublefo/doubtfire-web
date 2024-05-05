import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Task } from 'src/app/api/models/task';
import { NumbasLmsService } from 'src/app/api/services/numbas-lms.service';
import { AppInjector } from 'src/app/app-injector';
import { DoubtfireConstants } from 'src/app/config/constants/doubtfire-constants';

declare global {
  interface Window { API_1484_11: any; }
}

@Component({
  selector: 'f-numbas-component',
  templateUrl: './numbas-component.component.html',
  styleUrls: ['./numbas-component.component.scss'],
})
export class NumbasComponent implements OnInit {
  task: Task;
  currentMode: 'attempt' | 'review' = 'attempt';
  iframeSrc: SafeResourceUrl;

  constructor(
    private dialogRef: MatDialogRef<NumbasComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { task: Task, mode: 'attempt' | 'review' },
    private lmsService: NumbasLmsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.task = this.data.task;
    this.lmsService.setTask(this.task);

    window.API_1484_11 = {
      Initialize: () => this.lmsService.Initialize(this.currentMode),
      Terminate: () => this.lmsService.Terminate(),
      GetValue: (element: string) => this.lmsService.GetValue(element),
      SetValue: (element: string, value: string) => this.lmsService.SetValue(element, value),
      Commit: () => this.lmsService.Commit(),
      GetLastError: () => this.lmsService.GetLastError(),
      GetErrorString: (errorCode: string) => this.lmsService.GetErrorString(errorCode),
      GetDiagnostic: (errorCode: string) => this.lmsService.GetDiagnostic(errorCode)
    };

    this.currentMode = this.data.mode;

    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(`${AppInjector.get(DoubtfireConstants).API_URL}/numbas_api/${this.task.taskDefId}/index.html`);
  }

  removeNumbasTest(): void {
    const iframe = document.getElementsByTagName('iframe')[0];
    iframe?.parentNode?.removeChild(iframe);
    this.dialogRef.close();
  }
}
