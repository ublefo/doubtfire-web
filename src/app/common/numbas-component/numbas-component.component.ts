import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Task } from 'src/app/api/models/task';
import { NumbasLmsService } from 'src/app/api/services/numbas-lms.service';
import { NumbasService } from 'src/app/api/services/numbas.service';

declare global {
  interface Window { API_1484_11: any; }
}

@Component({
  selector: 'f-numbas-component',
  templateUrl: './numbas-component.component.html',
  styleUrls: ['numbas-component.component.scss'],
})
export class NumbasComponent implements OnInit, OnChanges {
  @Input() task: Task;

  currentMode: 'attempt' | 'review' = 'attempt';

  constructor(
    private numbasService: NumbasService,
    private lmsService: NumbasLmsService,
  ) {}

  ngOnInit(): void {
    this.interceptIframeRequests();

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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.task) {
      this.task = changes.task.currentValue;
      this.lmsService.setTask(this.task);
    }
  }

  launchNumbasTest(mode: 'attempt' | 'review' = 'attempt'): void {
    this.currentMode = mode;

    const iframe = document.createElement('iframe');
    iframe.src = `http://localhost:3000/api/numbas_api/${this.task.taskDefId}/index.html`;

    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.zIndex = '9999';

    document.body.appendChild(iframe);
  }

  interceptIframeRequests(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const numbasService = this.numbasService;
    const taskDefId = this.task.taskDefId;
    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
      if (typeof url === 'string' && url.startsWith('/api/numbas_api/')) {
        const resourcePath = url.replace('/api/numbas_api/', '');
        this.abort();
        numbasService.fetchResource(taskDefId, resourcePath).subscribe(
          (resourceData) => {
            if (this.onload) {
              this.onload.call(this, resourceData);
            }
          },
          (error) => {
            console.error('Error fetching Numbas resource:', error);
          }
        );
      } else {
        originalOpen.call(this, method, url, async, username, password);
      }
    };
  }
}
