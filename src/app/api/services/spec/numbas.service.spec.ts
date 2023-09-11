import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NumbasService } from '../numbas.service';
import { HttpRequest } from '@angular/common/http';

describe('NumbasService', () => {
  let numbasService: NumbasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NumbasService],
    });

    numbasService = TestBed.inject(NumbasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch resource as expected', fakeAsync(() => {
    const dummyBlob = new Blob(['dummy blob'], { type: 'text/html' });

    const unitId = 'sampleUnitId';
    const taskId = 'sampleTaskId';
    const resourcePath = 'sampleResource.html';

    numbasService.fetchResource(unitId, taskId, resourcePath).subscribe((blob) => {
      expect(blob.size).toBe(dummyBlob.size);
      expect(blob.type).toBe(dummyBlob.type);
    });

    const req = httpMock.expectOne(`http://localhost:3000/api/numbas_api/${unitId}/${taskId}/${resourcePath}`);
    expect(req.request.method).toBe('GET');

    req.flush(dummyBlob);

    tick();
  }));

  it('should upload test as expected', fakeAsync(() => {
    const dummyResponse = { success: true, message: 'File uploaded successfully' };

    const unitId = 'sampleUnitId';
    const taskId = 'sampleTaskId';
    const file = new File(['dummy content'], 'sample.txt', { type: 'text/plain' });

    numbasService.uploadTest(unitId, taskId, file).subscribe((response) => {
      expect(response).toEqual(dummyResponse);
    });

    const req = httpMock.expectOne(`http://localhost:3000/api/numbas_api/uploadNumbasTest`);
    expect(req.request.method).toBe('POST');

    req.flush(dummyResponse);

    tick();
  }));

});


