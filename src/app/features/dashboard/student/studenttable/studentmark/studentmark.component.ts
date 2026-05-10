import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { SortEvent } from 'primeng/api';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

interface Product {
    code: string;
    name: string;
    category: string;
    quantity: number;
}

@Component({
  selector: 'app-studenttables',
  standalone: true,
  imports: [CommonModule, TableModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  templateUrl: './studentmark.component.html',
  styleUrl: './studentmark.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudenttablesComponent implements OnInit {
    readonly markTypeOptions = [
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'halfly', label: 'Halfly' },
        { value: 'annually', label: 'Annually' }
    ];

    selectedMarkType = 'quarterly';
    products: Product[] = [];
    isLoading = false;
    isTeacherView = false;
    currentStudentId = '';
    currentClass = '';
    currentStudentName = '';
    rawRows: any[] = [];
    routeClassNo = '';

    constructor(
        private authService: AuthService,
        private cd: ChangeDetectorRef,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        const fromParam = (this.route.snapshot.queryParamMap.get('from') ?? '').toLowerCase();
        this.routeClassNo = this.route.snapshot.queryParamMap.get('classNo') ?? '';
        this.isTeacherView = this.authService.isTeacherRole() || fromParam === 'teacher';
        this.loadMarks(this.selectedMarkType);
    }

    onMarkTypeChange(markType: string): void {
        this.selectedMarkType = markType;
    }

    onSearch(): void {
        this.loadMarks(this.selectedMarkType);
    }

    onEditMark(product?: Product, index?: number): void {
        if (!this.isTeacherView) {
            return;
        }

        const rawRow = index != null ? this.rawRows[index] : undefined;

        this.router.navigate(['/teacher-add-mark'], {
            queryParams: {
                studentId: this.currentStudentId,
                class: this.currentClass,
                studentName: this.currentStudentName,
                subject: product?.name ?? '',
                mark: product?.quantity ?? '',
                period: this.selectedMarkType,
                from: 'student-mark'
            },
            state: rawRow ? { markRow: rawRow } : undefined
        });
    }


    private loadMarks(markType: string): void {
        const payload = this.buildMarksPayload(markType);

        if (!payload) {
            this.products = [];
            this.cd.markForCheck();
            return;
        }

        this.isLoading = true;

        this.authService
            .getStudentDetails(payload, 'User/student')
            .pipe(finalize(() => {
                this.isLoading = false;
                this.cd.markForCheck();
            }))
            .subscribe({
                next: (res) => {
                    const source = this.extractMarksSource(res);
                    const mappedRows = this.mapMarkRows(source);
                    this.products = mappedRows;
                    this.cd.markForCheck();
                },
                error: () => {
                    this.products = [];
                    this.rawRows = [];
                    this.cd.markForCheck();
                }
            });
    }

    private buildMarksPayload(markType: string): { request: { id: string; class: string; type: string; period: string } } | null {
        const dashboardData = this.authService.getSelectedStudentData?.() ?? this.authService.getStudentDashboardData() ?? {};
        const sources = this.getPayloadSources(dashboardData);

        const studentId = this.getFirstFieldValue(sources, [
            'StudentGUID',
            'studentGuid',
            'studentGUID',
            'StudentId',
            'studentId',
            'id',
            'UserId',
            'userId',
            'userid',
            'UserID'
        ]);

        const classValue = this.getFirstFieldValue(sources, [
            'Class',
            'class',
            'ClassNo',
            'classNo',
            'classno',
            'Standard',
            'standard'
        ]);

        const classFallback = classValue || this.routeClassNo;
        this.currentClass = classFallback;

        this.currentStudentId = studentId;
        this.currentStudentName = this.getFirstFieldValue(sources, [
            'StudentName',
            'studentName',
            'name'
        ]);

        if (!studentId || !classFallback) {
            return null;
        }

        return {
            request: {
                id: studentId,
                class: classFallback,
                type: 'marks',
                period: markType
            }
        };
    }

    private getPayloadSources(response: any): any[] {
        const sources: any[] = [];
        const pushIfObject = (value: any) => {
            if (value && typeof value === 'object') {
                sources.push(value);
            }
        };

        pushIfObject(response);
        pushIfObject(response?.status?.[0]?.[0]);
        pushIfObject(response?.status?.[0]);
        pushIfObject(response?.data?.[0]);
        pushIfObject(response?.data);
        pushIfObject(response?.student?.[0]);
        pushIfObject(response?.student);
        pushIfObject(response?.user?.[0]);
        pushIfObject(response?.user);
        pushIfObject(response?.response?.data?.[0]);
        pushIfObject(response?.response?.data);

        return sources;
    }

    private getFirstFieldValue(sources: any[], fieldNames: string[]): string {
        for (const source of sources) {
            for (const fieldName of fieldNames) {
                const value = source?.[fieldName];
                if (value != null && String(value).trim() !== '') {
                    return String(value).trim();
                }
            }
        }

        return '';
    }

    private extractMarksSource(res: any): any {
        if (Array.isArray(res?.status?.[0])) {
            return res.status[0][0];
        }

        if (Array.isArray(res?.status)) {
            return res.status[0];
        }

        if (Array.isArray(res?.data)) {
            return res.data;
        }

        if (res?.data && typeof res.data === 'object') {
            return res.data;
        }

        return res;
    }

    private mapMarkRows(response: any): Product[] {
        const rows = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.result)
                    ? response.result
                    : [];

        if (rows.length > 0) {
            this.rawRows = rows;
            return rows.map((row: any, index: number) => ({
                code: row.code ?? row.subjectCode ?? row.subject_code ?? `SUB-${index + 1}`,
                name: row.name ?? row.subject ?? row.subjectName ?? 'Subject',
                category: row.category ?? row.type ?? 'General',
                quantity: Number(row.quantity ?? row.mark ?? row.marks ?? row.score ?? 0)
            }));
        }

        if (!response || typeof response !== 'object') {
            this.rawRows = [];
            return [];
        }

        const excludeKeys = new Set([
            'period',
            'grade',
            'percentage',
            'total',
            'studentguid',
            'id',
            'class',
            'type',
            'studentname',
            'studentguid',
            'studentid'
        ]);

        const period = String(response.Period ?? this.selectedMarkType ?? 'General');
        const subjectEntries = Object.entries(response).filter(([key, value]) => {
            const normalizedKey = key.toLowerCase();
            return !excludeKeys.has(normalizedKey) && typeof value === 'number' && Number.isFinite(value);
        });

        // keep the original response aligned with each generated row
        this.rawRows = subjectEntries.map(() => response);

        return subjectEntries.map(([subject, mark], index) => ({
            code: `SUB-${index + 1}`,
            name: subject.replace(/([a-z])([A-Z])/g, '$1 $2'),
            category: period,
            quantity: Number(mark)
        }));
    }

    sortTableData(event: SortEvent) {
        (event.data as Product[]).sort((data1: Product, data2: Product) => {
            const field = event.field as keyof Product;

            const value1 = data1[field] ?? '';
            const value2 = data2[field] ?? '';

            let result = 0;

            if (value1 == null && value2 != null) {
                result = -1;
            } else if (value1 != null && value2 == null) {
                result = 1;
            } else if (value1 == null && value2 == null) {
                result = 0;
            } else if (typeof value1 === 'string' && typeof value2 === 'string') {
                result = value1.localeCompare(value2);
            } else {
                result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
            }

            return (event.order ?? 1) * result;
        });
    }
}
