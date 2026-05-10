import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentwidgetComponent } from './studentwidget.component';

describe('StudentwidgetComponent', () => {
  let component: StudentwidgetComponent;
  let fixture: ComponentFixture<StudentwidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentwidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentwidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
