import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddmarksComponent } from './addmarks.component';

describe('AddmarksComponent', () => {
  let component: AddmarksComponent;
  let fixture: ComponentFixture<AddmarksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddmarksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddmarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
