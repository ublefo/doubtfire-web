import {Component, OnInit, Input} from '@angular/core';
import {Task, TaskComment} from 'src/app/api/models/doubtfire-model';
import {ScormPlayerModal} from 'src/app/common/scorm-player/scorm-player-modal.component';

@Component({
  selector: 'scorm-comment',
  templateUrl: './scorm-comment.component.html',
  styleUrls: ['./scorm-comment.component.scss'],
})
export class ScormCommentComponent implements OnInit {
  @Input() task: Task;
  @Input() comment: TaskComment;

  constructor(private modalService: ScormPlayerModal) {}

  ngOnInit() {}

  reviewScormTest() {
    this.modalService.show(this.task, 'review');
  }
}
