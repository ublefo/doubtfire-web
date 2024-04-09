import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import { Task } from 'src/app/api/models/task';
import { TaskDefinition } from 'src/app/api/models/task-definition';
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
export class NumbasComponent implements OnInit {
  @Input() task: Task;
  @Input() unit: Unit;
  @Input() taskDef: TaskDefinition;

  currentMode: 'attempt' | 'review' = 'attempt';

  constructor(
    private numbasService: NumbasService,
    private lmsService: NumbasLmsService,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
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

  launchNumbasTest(mode: 'attempt' | 'review' = 'attempt'): void {
    this.currentMode = mode;
    const iframe = this.renderer.createElement('iframe');
    this.renderer.setAttribute(iframe, 'src', 'http://localhost:3000/api/numbas_api/units/1/task_definitions/1/numbas_data/index.html');
    this.renderer.setStyle(iframe, 'width', '100%');
    this.renderer.setStyle(iframe, 'height', '800px');
    this.renderer.appendChild(document.body, iframe);
  }

  interceptIframeRequests(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const numbasService = this.numbasService;
    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
      if (typeof url === 'string' && url.startsWith('/api/numbas_api/')) {
        const resourcePath = url.replace('/api/numbas_api/', '');
        this.abort();
        numbasService.fetchResource(1, 1, resourcePath).subscribe(
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
