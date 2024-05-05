import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NumbasLmsService } from '../numbas-lms.service';
import { TaskService } from '../task.service';
import { UserService } from '../user.service';
import { of } from 'rxjs';

describe('NumbasLmsService', () => {
  let service: NumbasLmsService;
  let httpTestingController: HttpTestingController;
  let mockUserService: Partial<UserService>;
  let mockTaskService: Partial<TaskService>;

  const mockUserData = {
    currentUser: { studentId: '12345' }
  };

  beforeEach(() => {
    mockUserService = {
      currentUser: mockUserData.currentUser
    };

    mockTaskService = {
      // you can add mocked methods if needed for the TaskService
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NumbasLmsService,
        { provide: UserService, useValue: mockUserService },
        { provide: TaskService, useValue: mockTaskService }
      ]
    });

    service = TestBed.inject(NumbasLmsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(service.GetValue('cmi.completion_status')).toBe('not attempted');
    expect(service.GetValue('cmi.entry')).toBe('ab-initio');
  });

  describe('Initialize function', () => {

    it('should handle review mode and get latest completed test result', () => {
      const mockResponse = {
        data: {
          suspend_data: JSON.stringify({ someData: 'value' })
        }
      };

      service.Initialize('review');
      const req = httpTestingController.expectOne(`${service['apiBaseUrl']}/completed-latest`);
      expect(req.request.method).toEqual('GET');
      req.flush(mockResponse);

      expect(service.GetValue('cmi.suspend_data')).toEqual(JSON.stringify({ someData: 'value' }));
    });

    it('should handle attempt mode and get latest test result', () => {
      const mockResponse = {
        data: {
          id: 1,
          cmi_entry: 'ab-initio',
          attempt_number: 2
        }
      };

      service.Initialize('attempt');
      const req = httpTestingController.expectOne(`${service['apiBaseUrl']}/latest`);
      expect(req.request.method).toEqual('GET');
      req.flush(mockResponse);

      expect(service.GetValue('cmi.learner_id')).toBe('12345');
    });
  });

});
