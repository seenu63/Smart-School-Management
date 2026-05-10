import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkchartComponent } from './markchart.component';

describe('MarkchartComponent', () => {
  let component: MarkchartComponent;
  let fixture: ComponentFixture<MarkchartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkchartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
