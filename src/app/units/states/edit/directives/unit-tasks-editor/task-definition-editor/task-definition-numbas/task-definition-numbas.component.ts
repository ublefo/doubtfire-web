import { Component, Inject, Input } from '@angular/core';
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
      // Temporary until Numbas backend is fixed: save uploaded file to local Downloads folder
      this.saveZipFile(file);
      this.taskDefinition.hasUploadedNumbasTest = true;
      // this.taskDefinitionService.uploadNumbasTest(this.taskDefinition, file).subscribe({
      //   next: () => this.alerts.add('success', 'Uploaded Numbas test', 2000),
      //   error: (message) => this.alerts.add('danger', message, 6000),
      // });
    } else {
      this.alerts.add('danger', 'Please drop a ZIP to upload for this task', 6000);
    }
  }

  private saveZipFile(zipData) {
    const blob = new Blob([zipData], {type: 'application/zip'});

    // Create an anchor element and set its href to the blob URL
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'numbas.zip';

    // Append the link to the document, trigger the download, then remove the link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
