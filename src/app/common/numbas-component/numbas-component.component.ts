import { Component, Input, OnChanges } from '@angular/core';
import { Task } from 'src/app/api/models/task';
import { Unit } from 'src/app/api/models/unit';
import { NumbasLmsService } from 'src/app/api/services/numbas-lms.service';
import { NumbasService } from 'src/app/api/services/numbas.service';

declare global {
  interface Window { API_1484_11: any; }
}

@Component({
  selector: 'f-numbas-component',
  templateUrl: './numbas-component.component.html'
})
export class NumbasComponent implements OnChanges {
  @Input() task: Task;
  unit: Unit;

  currentMode: 'attempt' | 'review' = 'attempt';

  constructor(
    private numbasService: NumbasService,
    private lmsService: NumbasLmsService
  ) {}

  ngOnChanges(): void {
    if (this.task) {
      this.lmsService.setTask(this.task);
      this.unit = this.task.unit;

      this.interceptIframeRequests();

      window.API_1484_11 =  {
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
  }

  launchNumbasTest(mode: 'attempt' | 'review' = 'attempt'): void {
    this.currentMode = mode;
    const iframe = document.createElement('iframe');
    iframe.src = 'http://localhost:4200/api/numbas_api/index.html';
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    document.body.appendChild(iframe);
  }

  setReviewMode(): void {
    this.reviewTest();
  }

  removeNumbasTest(): void {
    const iframe = document.getElementsByTagName('iframe')[0];
    iframe?.parentNode?.removeChild(iframe);
  }

  reviewTest(): void {
    this.launchNumbasTest('review');
  }

  interceptIframeRequests(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const numbasService = this.numbasService;
    const unitId = this.unit.id;
    const taskDefId = this.task.definition.id;
    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
      if (typeof url === 'string' && url.startsWith('/api/numbas_api/')) {
        const resourcePath = url.replace('/api/numbas_api/', '');
        this.abort();
        numbasService.fetchResource(unitId, taskDefId, resourcePath).subscribe(
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
