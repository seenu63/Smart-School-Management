import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';


interface StudentFormModel {
  fullName: string;
  gender: string;
  dob: string;
  classNo: string;
  admissionDate: string;
  email: string;
  phone: string;
  fatherName: string;
  motherName: string;
  parentPhone: string;
  address: string;
  role: string;
  createdBy: string;
  boardType: string;
  hscGroup: string;
}

interface SavedStudent extends StudentFormModel {
}

@Component({
  selector: 'app-addstudent',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatNativeDateModule,MatSelectModule, MatDatepickerModule],
  templateUrl: './addstudent.component.html',
  styleUrl: './addstudent.component.css',
})
export class AddstudentComponent implements OnInit {
  submitted = false;
  saveMessage = '';
  saveMessageType: 'success' | 'error' = 'success';

  // Class options (Grades 6–12)
  classOptions = ['6', '7', '8', '9', '10', '11', '12'];
  hscGroups: string[] = ['CS', 'PURE_SCIENCE', 'BIOLOGY'];

  student!: StudentFormModel;
  savedStudents: SavedStudent[] = [];

  constructor(
      private toastService: ToastService,
      private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.student = this.createEmptyForm();
  }

  
  saveStudent(): void {
    this.submitted = true;

    if (!this.isValid()) {
      this.showMessage('Please fill all required fields.', 'error');
      return;
    }
  
    const finaljson = {
      request:{
      student: this.student,
      operation:"insert",
      type : 'student'
      }
    };
   
     this.authService.getStudentDetails(finaljson,'User/addstudent').subscribe({
      next: (res) => {
         if (res && res?.status[0][0]?.ProcessStatus.toLowerCase() === 'success') {   
         this.showMessage('Student saved successfully.', 'success');
         this.student = this.createEmptyForm();
         this.submitted = false;
         } else {
         this.showMessage(res?.status[0][0]?.Mgs, 'error');
         }  
     },
      error: () => {
        this.showMessage('Failed to save student. Please try again.', 'error');
      }
    }); 
  }

  private isValid(): boolean {
    return (
      !!this.student.fullName.trim() &&
      !!this.student.gender &&
      !!this.student.dob &&
      !!this.student.classNo.trim() &&
      (this.student.boardType !== 'HSC' || !!this.student.hscGroup.trim()) &&
      !!this.student.phone.trim() &&
      !!this.student.fatherName.trim() &&
      !!this.student.motherName.trim() &&
      !!this.student.parentPhone.trim() &&
      !!this.student.address.trim()
    );
  }


  private showMessage(message: string, type: 'success' | 'error'): void {
    this.saveMessage = message;
    this.saveMessageType = type;
    this.toastService.show(message, type);
  }

  private createEmptyForm(): StudentFormModel {
    return {
      fullName: '',
      gender: '',
      dob: '',
      classNo: '',    
      admissionDate: '',
      email: '',
      phone: '',
      fatherName: '',
      motherName: '',
      parentPhone: '',
      address: '',
      role: 'student',
      createdBy: this.authService.getUserId() ?? '',
      boardType: 'SSC',
      hscGroup: ''
    };
  }

  onClassChange(classValue: string): void {
    const num = Number(classValue);
    if (Number.isFinite(num)) {
      this.student.boardType = num >= 11 ? 'HSC' : 'SSC';
      if (this.student.boardType !== 'HSC') {
        this.student.hscGroup = '';
      }
    }
  }

}
