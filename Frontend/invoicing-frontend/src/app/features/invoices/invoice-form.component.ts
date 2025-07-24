import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subject, of, Subscription, timer } from 'rxjs';
import { takeUntil, switchMap, debounceTime, catchError, tap } from 'rxjs/operators';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';

// Services and Models
import { InvoiceService } from '../../core/services/invoice.service';
import { ClientService } from '../../core/services/client.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Invoice, InvoiceItem, InvoiceStatus } from '../../core/models/invoice.model';
import { Client } from '../../core/models/client.model';

// Shared Components
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    InputTextareaModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    TableModule,
    TagModule,
    RippleModule,
    CardComponent,
    ButtonComponent
  ],
  providers: [
    MessageService,
    ConfirmationService
  ],
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.scss'
})
export class InvoiceFormComponent implements OnInit, OnDestroy {
  invoiceForm!: FormGroup;
  clients: Client[] = [];
  isEditMode = false;
  invoiceId?: number;
  loading = true;
  saving = false;
  autoSaving = false;
  lastSaved: Date | null = null;
  
  private destroy$ = new Subject<void>();
  private autoSaveSubscription?: Subscription;
  private fieldChangeSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadClients();

    // Check if we're in edit mode
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.invoiceId = +id;
        this.loadInvoice(+id);
      } else {
        this.generateInvoiceNumber();
        this.handleClientPreSelection();
        this.loading = false;
        this.setupAutosave();
      }
    });

    // Set up automatic total calculation when items change
    this.itemsFormArray.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.calculateTotals();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
    if (this.fieldChangeSubscription) {
      this.fieldChangeSubscription.unsubscribe();
    }
  }
  
  // Helper to get the selected client name (for display in the dropdown)
  getSelectedClientName(): string {
    const clientId = this.invoiceForm?.get('clientId')?.value;
    if (!clientId) return '';
    
    const selectedClient = this.clients.find(c => c.id === clientId);
    return selectedClient?.name || '';
  }

  // Check if a client ID was passed as a query parameter
  private handleClientPreSelection(): void {
    this.route.queryParamMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const clientId = params.get('clientId');
      if (clientId) {
        const id = +clientId;
        this.invoiceForm.patchValue({ clientId: id });
        
        // Optionally, you can also load the client details to display additional information
        this.clientService.getClientById(id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (client) => {
            // If needed, you can use the client info here
            this.messageService.add({
              severity: 'info',
              summary: 'Client Selected',
              detail: `Creating invoice for ${client.name}`
            });
          },
          error: (error) => {
            console.error('Error loading pre-selected client', error);
          }
        });
      }
    });
  }

  // Form initialization
  private initForm(): void {
    this.invoiceForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      clientId: [null, Validators.required],
      issueDate: [new Date(), Validators.required],
      dueDate: [this.getDefaultDueDate(), Validators.required],
      taxRate: [0],
      notes: [''],
      items: this.fb.array([]),
      // Calculated fields (non-editable)
      subtotal: [0],
      taxAmount: [0],
      totalAmount: [0]
    });

    // Add at least one item by default
    this.addItem();
  }

  // Helper getter for the items FormArray
  get itemsFormArray(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  // Add a new line item to the form
  addItem(): void {
    const itemGroup = this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      totalPrice: [0]
    });

    // Calculate item total when quantity or unit price changes
    itemGroup.get('quantity')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.calculateItemTotal(this.itemsFormArray.length - 1));
    
    itemGroup.get('unitPrice')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.calculateItemTotal(this.itemsFormArray.length - 1));

    this.itemsFormArray.push(itemGroup);
    
    // Focus on the new item's description field (would need ViewChild/renderer in real implementation)
  }

  // Remove a line item from the form
  removeItem(index: number): void {
    this.itemsFormArray.removeAt(index);
    this.calculateTotals();
  }

  // Calculate the total for a specific line item
  calculateItemTotal(index: number): void {
    const items = this.itemsFormArray.controls;
    const item = items[index];
    
    const quantity = item.get('quantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    const totalPrice = quantity * unitPrice;
    
    item.get('totalPrice')?.setValue(totalPrice, { emitEvent: false });
    this.calculateTotals();
  }

  // Calculate subtotal, tax amount, and total amount
  calculateTotals(): void {
    const items = this.itemsFormArray.value;
    
    // Calculate subtotal
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    // Calculate tax amount
    const taxRate = this.invoiceForm.get('taxRate')?.value || 0;
    const taxAmount = subtotal * (taxRate / 100);
    
    // Calculate total
    const totalAmount = subtotal + taxAmount;
    
    // Update form values without triggering change detection loops
    this.invoiceForm.patchValue({
      subtotal,
      taxAmount,
      totalAmount
    }, { emitEvent: false });
  }

  // Helpers
  private getDefaultDueDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default: 30 days from now
    return date;
  }
  
  // Data loading
  private loadClients(): void {
    this.clientService.getClients().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.clients = response.items || [];
        
        if (this.clients.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'No Clients',
            detail: 'Please add clients before creating invoices'
          });
        }
      },
      error: (error) => {
        console.error('Error loading clients', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load clients. Please try again.'
        });
      }
    });
  }

  private loadInvoice(id: number): void {
    this.invoiceService.getInvoiceById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (invoice) => {
        this.populateForm(invoice);
        this.loading = false;
        this.setupAutosave();
      },
      error: (error) => {
        console.error('Error loading invoice', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load invoice. Please try again.'
        });
        this.loading = false;
      }
    });
  }

  private populateForm(invoice: Invoice): void {
    // Clear existing items first
    while (this.itemsFormArray.length) {
      this.itemsFormArray.removeAt(0);
    }
    
    // Convert date strings to Date objects if needed
    const issueDate = invoice.issueDate instanceof Date 
      ? invoice.issueDate 
      : new Date(invoice.issueDate);
      
    const dueDate = invoice.dueDate instanceof Date 
      ? invoice.dueDate 
      : new Date(invoice.dueDate);
    
    // Populate main form fields
    this.invoiceForm.patchValue({
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId || (invoice.client as Client).id,
      issueDate: issueDate,
      dueDate: dueDate,
      taxRate: invoice.taxAmount && invoice.subtotal 
        ? (invoice.taxAmount / invoice.subtotal) * 100 
        : 0,
      notes: invoice.notes || '',
      subtotal: invoice.subtotal || 0,
      taxAmount: invoice.taxAmount || 0,
      totalAmount: invoice.total || 0
    });
    
    // Add invoice items
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach(item => {
        const itemGroup = this.fb.group({
          id: [item.id || null],
          description: [item.description, Validators.required],
          quantity: [item.quantity, [Validators.required, Validators.min(0.01)]],
          unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
          totalPrice: [item.quantity * item.unitPrice]
        });
        
        // Setup change listeners for new item
        itemGroup.get('quantity')?.valueChanges.pipe(
          takeUntil(this.destroy$)
        ).subscribe(() => this.calculateItemTotal(this.itemsFormArray.length - 1));
        
        itemGroup.get('unitPrice')?.valueChanges.pipe(
          takeUntil(this.destroy$)
        ).subscribe(() => this.calculateItemTotal(this.itemsFormArray.length - 1));
        
        this.itemsFormArray.push(itemGroup);
      });
    } else {
      // Add at least one empty item
      this.addItem();
    }
    
    this.calculateTotals();
  }

  private generateInvoiceNumber(): void {
    this.invoiceService.generateInvoiceNumber().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (invoiceNumber: string) => {
        this.invoiceForm.patchValue({ invoiceNumber });
      },
      error: (err: any) => {
        console.error('Error generating invoice number', err);
        const fallbackNumber = `INV-${new Date().getTime()}`;
        this.invoiceForm.patchValue({ invoiceNumber: fallbackNumber });
      }
    });
  }

  // Autosave functionality
  private setupAutosave(): void {
    // Autosave on form changes (after a delay)
    this.fieldChangeSubscription = this.invoiceForm.valueChanges.pipe(
      debounceTime(2000), // Wait 2 seconds after changes stop
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.autosave();
    });

    // Also set up a timer to save periodically
    this.autoSaveSubscription = timer(120000, 120000).pipe( // Every 2 minutes
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.invoiceForm.dirty) {
        this.autosave();
      }
    });
  }

  private autosave(): void {
    if (!this.invoiceForm.valid) return;
    
    this.autoSaving = true;
    
    // Prepare data for saving
    const invoiceData = this.prepareFormData();
    
    // Save as draft
    const saveOperation = this.isEditMode && this.invoiceId 
      ? this.invoiceService.updateInvoice(this.invoiceId, invoiceData) 
      : this.invoiceService.createInvoice({ ...invoiceData, status: InvoiceStatus.DRAFT });
      
    saveOperation.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.lastSaved = new Date();
        this.autoSaving = false;
        
        if (!this.isEditMode && !this.invoiceId) {
          // If this was a new invoice, switch to edit mode
          this.isEditMode = true;
          this.invoiceId = response.id;
          
          // Update URL without reloading (replace state)
          const url = this.router.createUrlTree(['/invoices', response.id, 'edit']).toString();
          window.history.replaceState({}, '', url);
        }
      },
      error: (error) => {
        console.error('Autosave failed', error);
        this.autoSaving = false;
      }
    });
  }

  // Form submission and actions
  saveAsDraft(): void {
    if (!this.invoiceForm.valid) {
      this.markFormGroupTouched(this.invoiceForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields'
      });
      return;
    }
    
    this.saving = true;
    const invoiceData = this.prepareFormData();
    
    const saveOperation = this.isEditMode && this.invoiceId 
      ? this.invoiceService.updateInvoice(this.invoiceId, { ...invoiceData, status: InvoiceStatus.DRAFT }) 
      : this.invoiceService.createInvoice({ ...invoiceData, status: InvoiceStatus.DRAFT });
      
    saveOperation.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Invoice saved as draft'
        });
        
        // Navigate to invoice detail view
        setTimeout(() => this.router.navigate(['/invoices', response.id || this.invoiceId]), 500);
      },
      error: (error) => {
        console.error('Error saving draft', error);
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save draft. Please try again.'
        });
      }
    });
  }

  saveAndSend(): void {
    if (!this.invoiceForm.valid) {
      this.markFormGroupTouched(this.invoiceForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields'
      });
      return;
    }
    
    this.saving = true;
    const invoiceData = this.prepareFormData();
    
    const saveOperation = this.isEditMode && this.invoiceId 
      ? this.invoiceService.updateInvoice(this.invoiceId, { ...invoiceData, status: InvoiceStatus.PENDING }) 
      : this.invoiceService.createInvoice({ ...invoiceData, status: InvoiceStatus.PENDING });
      
    saveOperation.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Invoice saved and ready to be sent'
        });
        
        // Navigate to invoice detail view
        setTimeout(() => this.router.navigate(['/invoices', response.id || this.invoiceId]), 500);
      },
      error: (error) => {
        console.error('Error saving invoice', error);
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save invoice. Please try again.'
        });
      }
    });
  }

  // Helper to prepare form data for submission
  private prepareFormData(): any {
    const formValue = this.invoiceForm.value;
    
    return {
      id: this.invoiceId,
      invoiceNumber: formValue.invoiceNumber,
      clientId: formValue.clientId,
      issueDate: formValue.issueDate,
      dueDate: formValue.dueDate,
      notes: formValue.notes,
      taxRate: formValue.taxRate || 0,
      items: formValue.items.map((item: any) => ({
        id: item.id, // Include ID for existing items
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };
  }

  // Helper to validate all form controls
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(ctrl => {
          if (ctrl instanceof FormGroup) {
            this.markFormGroupTouched(ctrl);
          } else {
            ctrl.markAsTouched();
          }
        });
      }
    });
  }

  // Format helper for display
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }
} 