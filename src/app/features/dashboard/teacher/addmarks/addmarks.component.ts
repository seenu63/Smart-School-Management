import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange, MatSelect } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { LoadingOverlayComponent } from '../../../../shared/loading-overlay/loading-overlay.component';

interface StudentOption {
  name: string;
  guid: string;
  class: string;
}

interface MarkFormModel {
  studentName: string;
  studentId: string;
  boardType: string;
  hscGroup: string;
  classNo: string;
  examType: string;
  tamil: string;
  english: string;
  maths: string;
  science: string;
  social: string;
  physics: string;
  chemistry: string;
  cs: string;
  biology: string;
  totalMark: string;
  examDate: string | Date;
  createdBy: string;
}

interface SavedMark extends MarkFormModel {
  id: number;
  createdAt: string;
}

@Component({
  selector: 'app-addmarks',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatDatepickerModule, MatNativeDateModule, LoadingOverlayComponent],
  templateUrl: './addmarks.component.html',
  styleUrl: './addmarks.component.css',
})
export class AddmarksComponent implements OnInit {
  private readonly storageKey = 'teacher_saved_marks';
  @ViewChild('studentSelect') studentSelect?: MatSelect;

  submitted = false;
  saveMessage = '';
  saveMessageType: 'success' | 'error' = 'success';

  mark!: MarkFormModel;
  savedMarks: SavedMark[] = [];
  isEditMode = false;

  readonly examTypes: string[] = ['Unit Test', 'Quarterly', 'Half Yearly', 'Annual'];
  readonly boardTypes: string[] = ['SSC', 'HSC'];
  readonly hscGroups: string[] = ['CS', 'PURE_SCIENCE', 'BIOLOGY'];
  readonly classOptions: string[] = ['6', '7', '8', '9', '10', '11', '12'];
  selectedClasses: string[] = [];
  studentOptions: StudentOption[] = [];

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mark = this.createEmptyForm();
    this.loadSavedMarks();
    this.recalcTotal();
    this.prefillFromQueryParams();
    this.prefillFromApiIfNeeded();
    this.ensureStudentOption();
  }

  saveMark(op?: 'insert' | 'update'): void {
    this.submitted = true;

    if (!this.isValid()) {
      this.showMessage('Please fill all required fields.', 'error');
      return;
    }

    const operation = op ?? (this.isEditMode ? 'update' : 'insert');
    const classNo = this.selectedClasses[0] ?? '';

    this.loadingService.show();
    const apiPayload = this.buildAddMarkPayload({
      ...this.mark,
      studentName: this.mark.studentName.trim(),
      studentId: this.mark.studentId.trim(),
      boardType: this.mark.boardType.trim().toUpperCase(),
      hscGroup: this.showHscSubjects ? this.mark.hscGroup.trim().toUpperCase() : '',
      classNo,
      tamil: this.mark.tamil.trim(),
      english: this.mark.english.trim(),
      maths: this.showMaths ? this.mark.maths.trim() : '',
      science: this.showScience ? this.mark.science.trim() : '',
      social: this.showSscSubjects ? this.mark.social.trim() : '',
      physics: this.showHscSubjects ? this.mark.physics.trim() : '',
      chemistry: this.showHscSubjects ? this.mark.chemistry.trim() : '',
      cs: this.requiresCs ? this.mark.cs.trim() : '',
      biology: this.requiresBiology ? this.mark.biology.trim() : '',
      totalMark: this.mark.totalMark,
      examDate: this.normalizeExamDate(this.mark.examDate)
    }, operation);

    this.authService.getStudentDetails(apiPayload, 'User/addstudent').subscribe({
      next: (res) => {
        if (res && res?.status?.[0]?.[0]?.ProcessStatus?.toLowerCase?.() === 'success') {
          this.showMessage(res?.status?.[0]?.[0]?.Mgs, 'success');
          this.mark = this.createEmptyForm();
          this.submitted = false;
        } else {
          const msg = res?.status?.[0]?.[0]?.Mgs || 'Unable to save mark.';
          this.showMessage(msg, 'error');
        }
        this.loadingService.hide();
      },
      error: () => {
        this.showMessage('Failed to save mark. Please try again.', 'error');
        this.loadingService.hide();
      }
    });
  }

  deleteMark(): void {
    if (!this.mark.studentId) {
      this.showMessage('No student selected to delete marks.', 'error');
      return;
    }

    this.loadingService.show();
    const apiPayload = this.buildAddMarkPayload({
      ...this.mark,
      examDate: this.normalizeExamDate(this.mark.examDate)
    }, 'delete');

    this.authService.getStudentDetails(apiPayload, 'User/addstudent').subscribe({
      next: (res) => {
        if (res && res?.status?.[0]?.[0]?.ProcessStatus?.toLowerCase?.() === 'success') {
          this.showMessage('Mark deleted successfully.', 'success');
          this.resetForm();
        } else {
          const msg = res?.status?.[0]?.[0]?.Mgs || 'Unable to delete mark.';
          this.showMessage(msg, 'error');
        }
        this.loadingService.hide();
      },
      error: (err) => {
        const apiMsg =
          err?.error?.error ??
          err?.error?.message ??
          err?.message ??
          'Failed to delete mark. Please try again.';
        this.showMessage(apiMsg, 'error');
        this.loadingService.hide();
      }
    });
  }

  private isValid(): boolean {
    const total = Number(this.mark.totalMark);

    return (
      !!this.mark.studentName.trim() &&
      !!this.mark.studentId.trim() &&
      !!this.mark.boardType &&
      (!this.showHscSubjects || !!this.mark.hscGroup) &&
      this.selectedClasses.length === 1 &&
      !!this.mark.examType &&
      !!this.mark.tamil.trim() &&
      !!this.mark.english.trim() &&
      (!this.showMaths || !!this.mark.maths.trim()) &&
      (!this.showScience || !!this.mark.science.trim()) &&
      (!this.showSscSubjects || !!this.mark.social.trim()) &&
      (!this.showHscSubjects ||
        (!!this.mark.physics.trim() &&
          !!this.mark.chemistry.trim() &&
          (!this.requiresCs || !!this.mark.cs.trim()) &&
          (!this.requiresBiology || !!this.mark.biology.trim()))) &&
      (this.isEditMode || !!this.mark.examDate) &&
      Number.isFinite(total) &&
      total > 0
    );
  }

  private loadSavedMarks(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SavedMark[];
      this.savedMarks = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.savedMarks = [];
    }
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.saveMessage = message;
    this.saveMessageType = type;
    this.toastService.show(message, type);
  }

  private normalizeExamDate(value: string | Date): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).trim();
  }

  get showHscSubjects(): boolean {
    return (this.mark?.boardType ?? '') === 'HSC';
  }

  get showSscSubjects(): boolean {
    return (this.mark?.boardType ?? '') === 'SSC';
  }

  get showMaths(): boolean {
    return !(this.showHscSubjects && (this.mark?.hscGroup ?? '') === 'PURE_SCIENCE');
  }

  get showScience(): boolean {
    return !this.showHscSubjects;
  }

  get requiresCs(): boolean {
    return this.showHscSubjects && this.mark.hscGroup === 'CS';
  }

  get requiresBiology(): boolean {
    return this.showHscSubjects && (this.mark.hscGroup === 'BIOLOGY' || this.mark.hscGroup === 'PURE_SCIENCE');
  }

  private createEmptyForm(): MarkFormModel {
    return {
      studentId: '',
      studentName: '',
      boardType: 'SSC',
      hscGroup: '',
      classNo: '',
      examType: '',
      tamil: '',
      english: '',
      maths: '',
      science: '',
      social: '',
      physics: '',
      chemistry: '',
      cs: '',
      biology: '',
      totalMark: '',
      examDate: '',
      createdBy: this.authService.getUserId?.() ?? ''
    };
  }

  onMarksChanged(): void {
    this.recalcTotal();
  }

  onBoardTypeChange(event: MatSelectChange): void {
    this.mark.boardType = event.value;
    this.clearHiddenSubjects();
    this.recalcTotal();
  }

  toggleClassOption(cls: string, checked: boolean): void {
    // close student dropdown if open so class change applies cleanly
    this.studentSelect?.close();

    const previous = this.selectedClasses[0] ?? '';
    this.selectedClasses = checked ? [cls] : [];

    if (checked && previous !== cls) {
      this.mark = this.createEmptyForm();
      this.submitted = false;
      this.studentOptions = [];
      this.recalcTotal();
    }

    this.updateBoardTypeFromSelectedClass();
    this.loadStudentOptions();
  }

  onHscGroupChange(event: MatSelectChange): void {
    this.mark.hscGroup = event.value;
    this.clearHiddenSubjects();
    this.recalcTotal();
  }

  private clearHiddenSubjects(): void {
    if (!this.showMaths) {
      this.mark.maths = '';
    }
    if (!this.showSscSubjects) {
      this.mark.social = '';
    }
    if (!this.showHscSubjects) {
      this.mark.physics = '';
      this.mark.chemistry = '';
      this.mark.cs = '';
      this.mark.biology = '';
    } else {
      if (!this.requiresCs) {
        this.mark.cs = '';
      }
      if (!this.requiresBiology) {
        this.mark.biology = '';
      }
    }

    if (this.selectedClasses.length > 1) {
      this.selectedClasses = [this.selectedClasses[0]];
    }
  }

  private recalcTotal(): void {
    const values = [
      this.mark.tamil,
      this.mark.english,
      this.showMaths ? this.mark.maths : '',
      this.showScience ? this.mark.science : '',
      this.showSscSubjects ? this.mark.social : '',
      this.showHscSubjects ? this.mark.physics : '',
      this.showHscSubjects ? this.mark.chemistry : '',
      this.requiresCs ? this.mark.cs : '',
      this.requiresBiology ? this.mark.biology : '',
    ];

    const total = values.reduce((sum, val) => {
      const num = Number(val);
      return sum + (Number.isFinite(num) ? num : 0);
    }, 0);

    this.mark.totalMark = total > 0 ? String(total) : '';
  }

  onStudentSelected(guid: string): void {
    this.mark.studentId = guid;
    const selected = this.studentOptions.find((s) => s.guid === guid);
    if (selected) {
      this.mark.studentName = selected.name;
      this.selectedClasses = selected.class ? [selected.class] : this.selectedClasses;
    }
  }

  handleClassClick(cls: string): void {
    if (this.studentSelect?.panelOpen) {
      this.studentSelect.close();
    }
    const willCheck = !this.selectedClasses.includes(cls);
    this.toggleClassOption(cls, willCheck);
  }

  private loadStudentOptions(): void {
    const classNo = this.selectedClasses[0] ?? '';
    const payload = {
      request: {
        id: '',
        class: classNo,
        type: 'studentlist'
      }
    };

    this.loadingService.show();
    this.authService.getStudentDetails(payload, 'User/student').subscribe({
      next: (res) => {
        this.studentOptions = this.extractStudents(res);
        this.loadingService.hide();
      },
      error: () => {
        this.studentOptions = [];
        this.loadingService.hide();
      }
    });
  }

  private updateBoardTypeFromSelectedClass(): void {
    const cls = this.selectedClasses[0];
    if (!cls) {
      return;
    }
    const num = Number(cls);
    if (!Number.isFinite(num)) {
      return;
    }

    const desiredBoard = num >= 11 ? 'HSC' : 'SSC';
    if (this.mark.boardType !== desiredBoard) {
      this.mark.boardType = desiredBoard;
      this.clearHiddenSubjects();
      this.recalcTotal();
    }
  }

  private extractStudents(res: any): StudentOption[] {
    const list =
      (Array.isArray(res?.status?.[0]) && res.status[0]) ||
      (Array.isArray(res?.status) ? res.status : []) ||
      (Array.isArray(res) ? res : []);

    if (!Array.isArray(list)) {
      return [];
    }

    return list
      .filter((item) => item && typeof item === 'object')
      .map((item, index) => ({
        name: String(item.StudentName ?? item.name ?? '').trim(),
        guid: String(item.StudentGUID ?? item.guid ?? item.id ?? `fallback-${index}`).trim(),
        class: String(item.Class ?? item.class ?? '').trim()
      }))
      .filter((item) => item.name !== '' && item.guid !== '');
  }

  private buildAddMarkPayload(form: MarkFormModel, operation: 'insert' | 'update' | 'delete'): any {
    return {
      request: {
        student: {
          StudentName: form.studentName,
          StudenID: form.studentId,
          BoardType: form.boardType,
          HSCGroup: this.showHscSubjects ? form.hscGroup : '',
          Class: this.selectedClasses[0] ?? '',
          ExamType: form.examType,
          Tamil: form.tamil,
          English: form.english,
          Maths: form.maths,
          Science: this.showScience ? form.science : '',
          Social: form.social,
          Physics: form.physics,
          Chemistry: form.chemistry,
          CS: form.cs,
          Biology: form.biology,
          TotalMark: form.totalMark,
          ExamDate: form.examDate,
          CreatedBy: form.createdBy,
        },
        operation,
        type : 'mark'
      }
    };
  }

  private prefillFromQueryParams(): void {
    const nav = this.router.getCurrentNavigation();
    const markRow = nav?.extras?.state?.['markRow'];

    const params = this.route.snapshot.queryParamMap;
    const studentId = params.get('studentId')?.trim() ?? '';
    const studentName = params.get('studentName')?.trim() ?? '';
    const classNo = params.get('class')?.trim() ?? '';
    const period = (params.get('period') ?? '').trim().toLowerCase();
    const subject = (params.get('subject') ?? '').trim().toLowerCase().replace(/\s+/g, '');
    const markValue = params.get('mark');

    if (studentId) {
      this.mark.studentId = studentId;
      this.isEditMode = true;
    }

    if (studentName) {
      this.mark.studentName = studentName;
      this.isEditMode = true;
    }

    if (classNo) {
      this.selectedClasses = [classNo];
      this.isEditMode = true;
    }

    if (period) {
      const periodMap: Record<string, string> = {
        quarterly: 'Quarterly',
        halfly: 'Half Yearly',
        halfyearly: 'Half Yearly',
        annually: 'Annual',
        annual: 'Annual'
      };
      this.mark.examType = periodMap[period] ?? this.mark.examType;
    }

    if (subject && markValue != null) {
      const normalizedSubject = subject;
      const subjectMap: Record<string, keyof MarkFormModel> = {
        tamil: 'tamil',
        english: 'english',
        maths: 'maths',
        math: 'maths',
        mathematics: 'maths',
        science: 'science',
        social: 'social',
        socialscience: 'social',
        physics: 'physics',
        chemistry: 'chemistry',
        cs: 'cs',
        computerscience: 'cs',
        biology: 'biology'
      };

      const targetField = subjectMap[normalizedSubject];
      if (targetField) {
        this.mark[targetField] = markValue;
        this.isEditMode = true;
      }
    }

    if (markRow && typeof markRow === 'object') {
      this.prefillFromRow(markRow);
      this.isEditMode = true;
    }

    this.recalcTotal();
    this.ensureStudentOption();
  }

  private prefillFromApiIfNeeded(): void {
    // If we already have subject values, skip.
    const hasSubjects =
      this.mark.tamil ||
      this.mark.english ||
      this.mark.maths ||
      this.mark.science ||
      this.mark.social ||
      this.mark.physics ||
      this.mark.chemistry ||
      this.mark.cs ||
      this.mark.biology;

    const studentId = this.mark.studentId.trim();
    const classNo = (this.selectedClasses[0] ?? '').trim() || (this.route.snapshot.queryParamMap.get('class') ?? '').trim();
    const period = (this.route.snapshot.queryParamMap.get('period') ?? '').trim() || 'quarterly';

    if (hasSubjects || !studentId || !classNo) {
      return;
    }

    const payload = {
      request: {
        id: studentId,
        class: classNo,
        type: 'marks',
        period
      }
    };

    this.loadingService.show();
    this.authService.getStudentDetails(payload, 'User/student').subscribe({
      next: (res) => {
        const row = this.pickFirstMarkRow(res);
        if (row) {
          this.prefillFromRow(row);
          this.recalcTotal();
          this.ensureStudentOption();
          this.isEditMode = true;
        }
        this.loadingService.hide();
      },
      error: () => {
        this.loadingService.hide();
      }
    });
  }

  private pickFirstMarkRow(res: any): any | null {
    // Sample shape: status: [[{Tamil:50, ...}]]
    if (Array.isArray(res?.status) && Array.isArray(res.status[0]) && res.status[0][0]) {
      return res.status[0][0];
    }
    if (Array.isArray(res?.data) && res.data[0]) {
      return res.data[0];
    }
    if (Array.isArray(res)) {
      return res[0] ?? null;
    }
    if (res && typeof res === 'object') {
      return res;
    }
    return null;
  }

  private ensureStudentOption(): void {
    if (!this.mark.studentId || !this.mark.studentName) {
      return;
    }

    const exists = this.studentOptions.some((s) => s.guid === this.mark.studentId);
    if (!exists) {
      this.studentOptions = [
        ...this.studentOptions,
        {
          guid: this.mark.studentId,
          name: this.mark.studentName,
          class: this.selectedClasses[0] ?? ''
        }
      ];
    }
  }

  private prefillFromRow(row: any): void {
    // student identity fallbacks
    if (!this.mark.studentId) {
      const guid = `${row?.StudentGUID ?? row?.studentGuid ?? ''}`.trim();
      if (guid) {
        this.mark.studentId = guid;
      }
    }

    if (!this.mark.studentName) {
      const name = `${row?.StudentName ?? row?.studentName ?? ''}`.trim();
      if (name) {
        this.mark.studentName = name;
      }
    }

    if (this.selectedClasses.length === 0) {
      const classNo = `${row?.Class ?? row?.class ?? ''}`.trim();
      if (classNo) {
        this.selectedClasses = [classNo];
      }
    }

    // Period -> exam type fallback
    if (!this.mark.examType) {
      const periodVal = `${row?.Period ?? row?.period ?? ''}`.trim();
      if (periodVal) {
        this.mark.examType = periodVal;
      }
    }

    const setIfPresent = (keyVariants: string[], target: keyof MarkFormModel) => {
      for (const key of keyVariants) {
        const value = row?.[key];
        if (value != null && `${value}`.trim() !== '') {
          this.mark[target] = `${value}`.trim();
          return;
        }
      }
    };

    setIfPresent(['Tamil', 'tamil'], 'tamil');
    setIfPresent(['English', 'english'], 'english');
    setIfPresent(['Maths', 'maths', 'Math', 'math'], 'maths');
    setIfPresent(['Science', 'science'], 'science');
    setIfPresent(['Social', 'social', 'SocialScience', 'socialScience', 'socialscience'], 'social');
    setIfPresent(['Physics', 'physics'], 'physics');
    setIfPresent(['Chemistry', 'chemistry'], 'chemistry');
    setIfPresent(['CS', 'cs', 'ComputerScience', 'Cs'], 'cs');
    setIfPresent(['Biology', 'biology'], 'biology');

    // Board/Exam helpers
    const board = `${row?.BoardType ?? row?.boardType ?? ''}`.trim();
    if (board) {
      this.mark.boardType = board;
    }

    const hscGroup = `${row?.HSCGroup ?? row?.hscGroup ?? row?.Type ?? row?.type ?? ''}`.trim();
    if (hscGroup) {
      this.mark.hscGroup = hscGroup;
    }

    const examType = `${row?.ExamType ?? row?.examType ?? ''}`.trim();
    if (examType) {
      this.mark.examType = examType;
    }

    const examDate = row?.ExamDate ?? row?.examDate;
    if (examDate) {
      this.mark.examDate = examDate;
    }

    this.updateBoardTypeFromSelectedClass();
  }

  resetForm(): void {
    this.mark = this.createEmptyForm();
    this.selectedClasses = [];
    this.studentOptions = [];
    this.submitted = false;
    this.isEditMode = false;
    this.recalcTotal();
  }
}
