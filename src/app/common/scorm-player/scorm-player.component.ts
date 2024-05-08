import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Task } from 'src/app/api/models/task';
import { ScormAdapterService } from 'src/app/api/services/scorm-adapter.service';
import { AppInjector } from 'src/app/app-injector';
import { DoubtfireConstants } from 'src/app/config/constants/doubtfire-constants';

declare global {
  interface Window { API_1484_11: any; }
}

@Component({
  selector: 'f-scorm-player',
  templateUrl: './scorm-player.component.html',
  styleUrls: ['./scorm-player.component.scss'],
})
export class ScormPlayerComponent implements OnInit {
  task: Task;
  currentMode: 'attempt' | 'review' = 'attempt';
  iframeSrc: SafeResourceUrl;

  constructor(
    private dialogRef: MatDialogRef<ScormPlayerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { task: Task, mode: 'attempt' | 'review' },
    private scormAdapter: ScormAdapterService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.task = this.data.task;
    this.scormAdapter.setTask(this.task);

    window.API_1484_11 = {
      Initialize: () => this.scormAdapter.Initialize(this.currentMode),
      Terminate: () => this.scormAdapter.Terminate(),
      GetValue: (element: string) => this.scormAdapter.GetValue(element),
      SetValue: (element: string, value: string) => this.scormAdapter.SetValue(element, value),
      Commit: () => this.scormAdapter.Commit(),
      GetLastError: () => this.scormAdapter.GetLastError(),
      GetErrorString: (errorCode: string) => this.scormAdapter.GetErrorString(errorCode),
      GetDiagnostic: (errorCode: string) => this.scormAdapter.GetDiagnostic(errorCode)
    };

    this.currentMode = this.data.mode;

    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(`${AppInjector.get(DoubtfireConstants).API_URL}/numbas_api/${this.task.taskDefId}/index.html`);
  }

  close(): void {
    console.log('SCORM player closing, commiting DataModel!');
    this.scormAdapter.Commit();
    const iframe = document.getElementsByTagName('iframe')[0];
    iframe?.parentNode?.removeChild(iframe);
    this.dialogRef.close();
  }
}
