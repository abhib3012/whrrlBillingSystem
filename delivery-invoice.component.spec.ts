import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryInvoiceComponent } from './delivery-invoice.component';

describe('DeliveryInvoiceComponent', () => {
  let component: DeliveryInvoiceComponent;
  let fixture: ComponentFixture<DeliveryInvoiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeliveryInvoiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
