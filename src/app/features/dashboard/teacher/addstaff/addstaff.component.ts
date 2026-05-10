import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { LoadingOverlayComponent } from '../../../../shared/loading-overlay/loading-overlay.component';
import { finalize } from 'rxjs/operators';


interface StaffFormModel {
  fullName: string;
  gender: string;
  dob: string;
  classNo: string[];
  email: string;
  role: string;
  createdBy: string;
}

interface SavedStaff extends StaffFormModel {
}

@Component({
  selector: 'app-addstaff',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatNativeDateModule,MatSelectModule, MatDatepickerModule, MatButtonModule, MatIconModule, LoadingOverlayComponent],
  templateUrl: './addstaff.component.html',
  styleUrl: './addstaff.component.css',
})
export class AddstaffComponent implements OnInit {
  submitted = false;
  saveMessage = '';
  saveMessageType: 'success' | 'error' = 'success';
  isEditMode = false;
  editIndex: number | null = null;

  // Class options (Grades 6-12)
  classOptions = ['6', '7', '8', '9', '10', '11', '12'];

  student!: StaffFormModel;
  savedStudents: SavedStaff[] = [];
  staffList: SavedStaff[] = [];

  constructor(
      private toastService: ToastService,
      private authService: AuthService,
      private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.student = this.createEmptyForm();
    this.loadStaffList();
  }

  
  saveStaff(): void {
    this.submitted = true;

    if (!this.isValid()) {
      this.showMessage('Please fill all required fields.', 'error');
      return;
    }

    const payloadStudent = {
      ...this.student,
      classNo: this.student.classNo.join('|') 
    };

    const finaljson = {
      request:{
      student: payloadStudent,
      operation: this.isEditMode ? 'update' : 'insert',
      type : 'Teacher'
      }
    };
   
    this.loadingService.show();
    this.authService.getStudentDetails(finaljson,'User/addstudent')
      .pipe(finalize(() => this.loadingService.hide()))
      .subscribe({
      next: (res) => {
         if (res && res?.status[0][0]?.ProcessStatus.toLowerCase() === 'success') {   
         this.showMessage('Staff saved successfully.', 'success');
         this.student = this.createEmptyForm();
         this.submitted = false;
         this.isEditMode = false;
         this.editIndex = null;
         this.loadStaffList();
         } else {
         this.showMessage(res?.status[0][0]?.Mgs, 'error');
         }  
     },
      error: (err) => {
        const msg = this.getApiErrorMessage(err, 'Failed to save staff. Please try again.');
        this.showMessage(msg, 'error');
      }
    }); 
  }

  deleteStaff(): void {
    if (!this.isEditMode) {
      return;
    }

    const payloadStudent = {
      ...this.student,
      classNo: this.student.classNo.join('|')
    };

    const finaljson = {
      request:{
      student: payloadStudent,
      operation: 'delete',
      type : 'staff'
      }
    };

    this.loadingService.show();
    this.authService.getStudentDetails(finaljson,'User/addstudent')
      .pipe(finalize(() => this.loadingService.hide()))
      .subscribe({
      next: (res) => {
         if (res && res?.status[0][0]?.ProcessStatus.toLowerCase() === 'success') {   
         this.showMessage('Staff deleted successfully.', 'success');
         this.student = this.createEmptyForm();
         this.submitted = false;
         this.isEditMode = false;
         this.editIndex = null;
         this.loadStaffList();
         } else {
         this.showMessage(res?.status[0][0]?.Mgs, 'error');
         }  
     },
      error: (err) => {
        const msg = this.getApiErrorMessage(err, 'Failed to delete staff. Please try again.');
        this.showMessage(msg, 'error');
      }
    });
  }

  private isValid(): boolean {
    return (
      !!this.student.fullName.trim() &&
      !!this.student.gender &&
      !!this.student.dob &&
      this.student.classNo.length > 0
    );
  }


  private showMessage(message: string, type: 'success' | 'error'): void {
    this.saveMessage = message;
    this.saveMessageType = type;
    this.toastService.show(message, type);
  }

  private createEmptyForm(): StaffFormModel {
    return {
      fullName: '',
      gender: '',
      dob: '',
      classNo: [],    
      email: '',
      role: 'Teacher',
      createdBy: this.authService.getUserId() ?? ''
    };
  }

  private loadStaffList(): void {
    const payload = {
      request: {
        id: '',
        class: '',
        type: 'stafflist'
      }
    };

    this.loadingService.show();
    this.authService.getStudentDetails(payload, 'User/student')
      .pipe(finalize(() => this.loadingService.hide()))
      .subscribe({
        next: (res) => {
          const list =
            (Array.isArray(res?.status?.[0]) && res.status[0]) ||
            (Array.isArray(res?.status) ? res.status : []) ||
            (Array.isArray(res) ? res : []);

          this.staffList = Array.isArray(list)
            ? list
                .filter((item) => item && typeof item === 'object')
                .map((item, index) => {
                  const classesRaw =
                    item.AccessRights ??
                    item.accessRights ??
                    item.Class ??
                    item.class ??
                    '';

                  return {
                    fullName: String(item.FullName ?? item.Fullname ?? item.fullName ?? item.fullname ?? item.name ?? `Staff ${index + 1}`).trim(),
                    gender: String(item.Gender ?? item.gender ?? '').trim(),
                    dob: String(item.DOB ?? item.dob ?? '').trim(),
                    classNo: String(classesRaw).trim().split('|').filter(Boolean),
                    email: String(item.Email ?? item.email ?? '').trim(),
                    role: String(item.Role ?? item.role ?? 'Teacher').trim() || 'Teacher',
                    createdBy: String(item.CreatedBy ?? item.createdBy ?? '').trim()
                  };
                })
            : [];
          if (!Array.isArray(list)) {
            this.showMessage(this.getApiErrorMessage(res, 'Failed to load staff list.'), 'error');
          }
        },
        error: (err) => {
          this.staffList = [];
          this.showMessage(this.getApiErrorMessage(err, 'Failed to load staff list.'), 'error');
        }
      });
  }

  onEditStaff(staff: SavedStaff, index: number): void {
    this.student = {
      ...staff,
      classNo: Array.isArray(staff.classNo) ? [...staff.classNo] : String(staff.classNo ?? '').split('|').filter(Boolean)
    };
    this.isEditMode = true;
    this.editIndex = index;
    this.submitted = false;
  }

  clearForm(): void {
    this.student = this.createEmptyForm();
    this.submitted = false;
    this.isEditMode = false;
    this.editIndex = null;
  }

  private getApiErrorMessage(err: any, fallback: string): string {
    return String(
      err?.error?.error ??
      err?.error?.message ??
      err?.message ??
      fallback
    );
  }
}
