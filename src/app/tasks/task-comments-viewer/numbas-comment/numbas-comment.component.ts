import { Component, OnInit, Input } from '@angular/core';
import { Task, TaskComment } from 'src/app/api/models/doubtfire-model';
import { NumbasModal } from 'src/app/common/numbas-component/numbas-modal.component';

@Component({
  selector: 'numbas-comment',
  templateUrl: './numbas-comment.component.html',
  styleUrls: ['./numbas-comment.component.scss'],
})
export class NumbasCommentComponent implements OnInit {
  @Input() task: Task;
  @Input() comment: TaskComment;

  constructor(private modalService: NumbasModal) {}

  ngOnInit() {}

  reviewNumbasTest() {
    this.modalService.show(this.task, 'review');
  }
}
