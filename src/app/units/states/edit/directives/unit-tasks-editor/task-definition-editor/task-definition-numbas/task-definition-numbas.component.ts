import { Component, Inject, Input } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { alertService } from 'src/app/ajs-upgraded-providers';
import { TaskDefinition } from 'src/app/api/models/task-definition';
import { Unit } from 'src/app/api/models/unit';
import { TaskDefinitionService } from 'src/app/api/services/task-definition.service';
import { FileDownloaderService } from 'src/app/common/file-downloader/file-downloader.service';

@Component({
  selector: 'f-task-definition-numbas',
  templateUrl: 'task-definition-numbas.component.html',
  styleUrls: ['task-definition-numbas.component.scss'],
})
export class TaskDefinitionNumbasComponent {
  @Input() taskDefinition: TaskDefinition;

  constructor(
    private fileDownloaderService: FileDownloaderService,
    @Inject(alertService) private alerts: any,
    private taskDefinitionService: TaskDefinitionService
  ) {}

  public scoreControl = new FormControl('', [Validators.max(100), Validators.min(0)]);

  public get unit(): Unit {
    return this.taskDefinition?.unit;
  }

  public downloadNumbasTest() {
    this.fileDownloaderService.downloadFile(
      this.taskDefinition.getNumbasTestUrl(true),
      this.taskDefinition.name + '-Numbas.zip',
    );
  }

  public removeNumbasTest() {
    this.taskDefinition.deleteNumbasTest().subscribe({
      next: () => this.alerts.add('success', 'Deleted Numbas test', 2000),
      error: (message) => this.alerts.add('danger', message, 6000),
    });
  }

  public uploadNumbasTest(files: FileList) {
    const validFiles = Array.from(files as ArrayLike<File>).filter((f) => f.type === 'application/zip');
    if (validFiles.length > 0) {
      const file = validFiles[0];
      this.taskDefinitionService.uploadNumbasData(this.taskDefinition, file).subscribe({
        next: () => this.alerts.add('success', 'Uploaded Numbas test data', 2000),
        error: (message) => this.alerts.add('danger', message, 6000),
      });
    } else {
      this.alerts.add('danger', 'Please drop a zip file to upload Numbas test data for this task', 6000);
    }
  }
}
