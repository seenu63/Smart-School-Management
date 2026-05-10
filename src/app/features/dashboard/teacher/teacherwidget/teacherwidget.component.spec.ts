import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherwidgetComponent } from './teacherwidget.component';

describe('TeacherwidgetComponent', () => {
  let component: TeacherwidgetComponent;
  let fixture: ComponentFixture<TeacherwidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherwidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherwidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
