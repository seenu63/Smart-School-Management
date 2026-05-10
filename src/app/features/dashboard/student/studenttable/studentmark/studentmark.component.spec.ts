import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudenttablesComponent } from './studentmark.component';

describe('StudenttablesComponent', () => {
  let component: StudenttablesComponent;
  let fixture: ComponentFixture<StudenttablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudenttablesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudenttablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
