import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface Post {
  id: number;
  title: string;
  body: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

   private TOKEN_KEY = 'token';
   private ROLE_KEY = 'role';
   private USER_ID_KEY = 'user_id';
   private STUDENT_DASHBOARD_KEY = 'student_dashboard_data';
   private SELECTED_STUDENT_KEY = 'selected_student_data';
   
   private baseUrl = environment.apiUrl;

   private isAuthSubject = new BehaviorSubject<boolean>(this.checkAuth());
   private studentDashboardSubject = new BehaviorSubject<any | null>(this.getStoredStudentDashboardData());
   private selectedStudentSubject = new BehaviorSubject<any | null>(this.getStoredSelectedStudentData());

  constructor(private http: HttpClient) {}

  private checkAuth(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }


  // Save token after login
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.isAuthSubject.next(true);
  }

  setUserId(userId: string): void {
    localStorage.setItem(this.USER_ID_KEY, userId);
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  setUserRole(role: string): void {
    localStorage.setItem(this.ROLE_KEY, this.normalizeRole(role));
  }

  setStudentDashboardData(data: any): void {
    if (data == null) {
      localStorage.removeItem(this.STUDENT_DASHBOARD_KEY);
      this.studentDashboardSubject.next(null);
      return;
    }

    localStorage.setItem(this.STUDENT_DASHBOARD_KEY, JSON.stringify(data));
    this.studentDashboardSubject.next(data);
  }

  getStudentDashboardData(): any | null {
    return this.studentDashboardSubject.value;
  }

  studentDashboardData$(): Observable<any | null> {
    return this.studentDashboardSubject.asObservable();
  }

  setSelectedStudentData(data: any): void {
    if (data == null) {
      localStorage.removeItem(this.SELECTED_STUDENT_KEY);
      this.selectedStudentSubject.next(null);
      return;
    }

    localStorage.setItem(this.SELECTED_STUDENT_KEY, JSON.stringify(data));
    this.selectedStudentSubject.next(data);
  }

  getSelectedStudentData(): any | null {
    return this.selectedStudentSubject.value;
  }

  selectedStudentData$(): Observable<any | null> {
    return this.selectedStudentSubject.asObservable();
  }

  getUserRole(): string {
    return this.normalizeRole(localStorage.getItem(this.ROLE_KEY) ?? '');
  }

  isTeacherRole(): boolean {
    return this.getUserRole() === 'teacher';
  }

  private normalizeRole(role: string): string {
    const value = role.trim().toLowerCase();
    if (value === 'teacher' || value === 'admin' || value === 'faculty') {
      return 'teacher';
    }
    if (value === 'student' || value === 'learner') {
      return 'student';
    }
    return '';
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Check user authenticated or not
  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  // Reactive authentication state
  isAuthenticated$(): Observable<boolean> {
    return this.isAuthSubject.asObservable();
  }

  // Logout user
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.STUDENT_DASHBOARD_KEY);
    localStorage.removeItem(this.SELECTED_STUDENT_KEY);
    this.isAuthSubject.next(false);
    this.studentDashboardSubject.next(null);
    this.selectedStudentSubject.next(null);
  }

  // GET
  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts`).pipe(shareReplay(1));
  }

  // POST
  createPost(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/User/login`, data);
  }

  // PUT
  updatePost(id: number, data: Partial<Post>): Observable<Post> {
    return this.http.put<Post>(`${this.baseUrl}/posts/${id}`, data);
  }

  // DELETE
  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/posts/${id}`);
  }

  getStudentDetails(data: any , suburl: string): Observable<any> {
    const normalizedSubUrl = suburl.replace(/^\/+|\/+$/g, '');
    return this.http.post<any>(`${this.baseUrl}/${normalizedSubUrl}`, data);
  }

  private getStoredStudentDashboardData(): any | null {
    const rawData = localStorage.getItem(this.STUDENT_DASHBOARD_KEY);

    if (!rawData) {
      return null;
    }

    try {
      return JSON.parse(rawData);
    } catch {
      localStorage.removeItem(this.STUDENT_DASHBOARD_KEY);
      return null;
    }
  }

  private getStoredSelectedStudentData(): any | null {
    const rawData = localStorage.getItem(this.SELECTED_STUDENT_KEY);

    if (!rawData) {
      return null;
    }

    try {
      return JSON.parse(rawData);
    } catch {
      localStorage.removeItem(this.SELECTED_STUDENT_KEY);
      return null;
    }
  }
}
