import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendancechartComponent } from './attendancechart.component';

describe('AttendancechartComponent', () => {
  let component: AttendancechartComponent;
  let fixture: ComponentFixture<AttendancechartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendancechartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendancechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
