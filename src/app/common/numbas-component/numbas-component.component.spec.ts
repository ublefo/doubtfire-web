import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumbasComponent } from './numbas-component.component';

describe('NumbasComponent', () => {
  let component: NumbasComponent;
  let fixture: ComponentFixture<NumbasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NumbasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumbasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
