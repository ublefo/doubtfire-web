import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import API_URL from 'src/app/config/constants/apiURL';

@Injectable({
  providedIn: 'root'
})
export class NumbasService {
  private readonly API_URL = `${API_URL}/numbas_api`;

  constructor(private http: HttpClient) {}

  /**
   * Fetches a specified resource for a given unit and task.
   *
   * @param unitId - The ID of the unit
   * @param taskId - The ID of the task
   * @param resourcePath - Path to the desired resource
   * @returns An Observable with the Blob of the fetched resource
   */
  fetchResource(unitId: string, taskId: string, resourcePath: string): Observable<any> {
    const resourceUrl = `${this.API_URL}/${unitId}/${taskId}/${resourcePath}`;
    const resourceMimeType = this.getMimeType(resourcePath);

    return this.http.get(resourceUrl, { responseType: 'blob' }).pipe(
      retry(3),
      map((blob) => new Blob([blob], { type: resourceMimeType })),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching Numbas resource:', error);
        return throwError('Error fetching Numbas resource.');
      })
    );
  }

  /**
   * Determines the MIME type of a resource based on its extension.
   *
   * @param resourcePath - Path of the resource
   * @returns MIME type string corresponding to the resource's extension
   */
  getMimeType(resourcePath: string): string {
    const extension = resourcePath.split('.').pop()?.toLowerCase();
    const mimeTypeMap: { [key: string]: string } = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    };

    return mimeTypeMap[extension || ''] || 'text/plain';
  }

  /**
   * Uploads a Numbas test file for a given unit and task.
   *
   * @param unitId - The ID of the unit
   * @param taskId - The ID of the task
   * @param file - File object representing the Numbas test to be uploaded
   * @returns An Observable with the response from the server
   */
  uploadTest(unitId: string, taskId: string, file: File): Observable<any> {
    const uploadUrl = `${this.API_URL}/uploadNumbasTest`;
    const formData = new FormData();

    formData.append('file', file);
    formData.append('unit_code', unitId);
    formData.append('task_definition_id', taskId);

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    };

    return this.http.post(uploadUrl, formData, httpOptions).pipe(
      retry(3),
      catchError((error: HttpErrorResponse) => {
        console.error('Error uploading Numbas test:', error);
        return throwError('Error uploading Numbas test.');
      })
    );
  }
}
