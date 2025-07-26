import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormsModule } from '@angular/forms';
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
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DialogModule } from 'primeng/dialog';

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
    FormsModule,
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
    TooltipModule,
    InputSwitchModule,
    DialogModule,
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
  isPaid = false;
  showEmailPreview = false;
  
  // Client data for email preview
  clientName = '';
  clientEmail = '';
  
  // Currency data
  currencies = [
    { code: 'USD', label: 'USD', symbol: '$', exchangeRate: 1 },
    { code: 'EUR', label: 'EUR', symbol: '€', exchangeRate: 0.85 },
    { code: 'GBP', label: 'GBP', symbol: '£', exchangeRate: 0.73 },
    { code: 'CAD', label: 'CAD', symbol: 'C$', exchangeRate: 1.25 },
    { code: 'AUD', label: 'AUD', symbol: 'A$', exchangeRate: 1.35 },
    { code: 'JPY', label: 'JPY', symbol: '¥', exchangeRate: 110 }
  ];
  
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
  
  // Called when client is changed in the dropdown
  onClientChange(): void {
    const clientId = this.invoiceForm.get('clientId')?.value;
    if (!clientId) {
      // Clear client-specific fields if client is removed
      this.invoiceForm.patchValue({
        companyName: '',
        companyAddress: ''
      });
      return;
    }
    
    // Get client details to populate related fields
    const selectedClient = this.clients.find(c => c.id === clientId);
    if (selectedClient) {
      // Format address properly if it's an object
      let formattedAddress = '';
      
      if (typeof selectedClient.address === 'object' && selectedClient.address) {
        const address = selectedClient.address;
        // Format as: street, city, state zipCode, country
        formattedAddress = [
          address.street,
          [address.city, address.state, address.zipCode].filter(Boolean).join(' '),
          address.country
        ].filter(Boolean).join(', ');
      } else if (selectedClient.address) {
        // If address is already a string, use it directly
        formattedAddress = selectedClient.address;
      } else {
        // Try to construct from individual fields if available
        const addressParts = [
          selectedClient.address,
          [selectedClient.city, selectedClient.state, selectedClient.zipCode].filter(Boolean).join(' '),
          selectedClient.country
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          formattedAddress = addressParts.join(', ');
        }
      }
      
      this.invoiceForm.patchValue({
        companyName: selectedClient.companyName || selectedClient.name,
        companyAddress: formattedAddress
      });
    }
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
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Could not load client information'
            });
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
      companyName: [''],
      companyAddress: ['', Validators.required],
      issueDate: [null, Validators.required],
      dueDate: [null, Validators.required],
      taxRate: [0],
      notes: [''],
      items: this.fb.array([]),
      // Calculated fields (non-editable)
      subtotal: [0],
      taxAmount: [0],
      totalAmount: [0],
      // Status fields
      status: [InvoiceStatus.DRAFT],
      paidAt: [null],
      // Currency
      currency: ['USD', Validators.required],
      exchangeRate: [1]
    });

    // Add at least one item by default
    this.addItem();
  }

  // Helper getter for the items FormArray
  get itemsFormArray(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  // New item form for the add item section
  newItemForm: FormGroup = this.fb.group({
    description: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.01)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]]
  });

  // Add a new line item to the form
  addItem(): void {
    // Check if we're using the new item form
    if (arguments.length === 0 && this.newItemForm) {
      if (!this.newItemForm.valid) {
        this.markFormGroupTouched(this.newItemForm);
        this.messageService.add({
          severity: 'error', 
          summary: 'Validation Error',
          detail: 'Please fill all required fields for the new item'
        });
        return;
      }

      const formValue = this.newItemForm.value;
      
      const itemGroup = this.fb.group({
        description: [formValue.description, Validators.required],
        quantity: [formValue.quantity, [Validators.required, Validators.min(0.01)]],
        unitPrice: [formValue.unitPrice, [Validators.required, Validators.min(0)]],
        totalPrice: [formValue.quantity * formValue.unitPrice]
      });

      // Reset the new item form
      this.newItemForm.reset({
        description: '',
        quantity: 1,
        unitPrice: 0
      });

      // Add the item to the form array
      this.setupItemListeners(itemGroup);
      this.itemsFormArray.push(itemGroup);
      this.calculateTotals();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Item Added',
        detail: 'New item has been added to the invoice'
      });
    } else {
      // Original implementation for programmatic addition (used during initialization)
      const itemGroup = this.fb.group({
        description: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(0.01)]],
        unitPrice: [0, [Validators.required, Validators.min(0)]],
        totalPrice: [0]
      });

      this.setupItemListeners(itemGroup);
      this.itemsFormArray.push(itemGroup);
    }
  }
  
  // Helper method to set up item listeners
  private setupItemListeners(itemGroup: FormGroup): void {
    // Calculate item total when quantity or unit price changes
    itemGroup.get('quantity')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const index = this.itemsFormArray.controls.indexOf(itemGroup);
      if (index >= 0) this.calculateItemTotal(index);
    });
    
    itemGroup.get('unitPrice')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const index = this.itemsFormArray.controls.indexOf(itemGroup);
      if (index >= 0) this.calculateItemTotal(index);
    });
  }

  // Remove a line item from the form
  removeItem(index: number): void {
    this.itemsFormArray.removeAt(index);
    this.calculateTotals();
  }

  // Calculate the total for a specific line item
  calculateItemTotal(index: number): void {
    if (index < 0 || index >= this.itemsFormArray.length) return;
    
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
    
    // Apply currency exchange rate
    const currency = this.invoiceForm.get('currency')?.value || 'USD';
    const exchangeRate = this.currencies.find(c => c.code === currency)?.exchangeRate || 1;
    
    // Update form values without triggering change detection loops
    this.invoiceForm.patchValue({
      subtotal,
      taxAmount,
      totalAmount,
      exchangeRate
    }, { emitEvent: false });
  }
  
  // Currency change handler
  onCurrencyChange(): void {
    const currency = this.invoiceForm.get('currency')?.value;
    const currencyInfo = this.currencies.find(c => c.code === currency);
    if (currencyInfo) {
      this.invoiceForm.patchValue({ 
        exchangeRate: currencyInfo.exchangeRate 
      });
      this.calculateTotals();
    }
  }
  
  // Toggle payment status from InputSwitch control
  onPaymentStatusChange(event: any): void {
    this.isPaid = event.checked;
    this.togglePaymentStatus();
  }
  
  // Toggle payment status with button
  togglePaymentStatus(): void {
    // Update status based on isPaid flag
    const status = this.isPaid ? InvoiceStatus.PAID : 
                  (this.isOverdue() ? InvoiceStatus.OVERDUE : InvoiceStatus.PENDING);
    const paidAt = this.isPaid ? new Date() : null;
    
    // Update form without triggering valueChanges
    this.invoiceForm.patchValue({ 
      status, 
      paidAt
    }, { emitEvent: false });
    
    if (this.invoiceId) {
      this.saving = true;
      
      this.invoiceService.updateInvoiceStatus(this.invoiceId, status).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.saving = false;
          
          // Make sure the status in the form matches the response
          if (response && response.status) {
            this.invoiceForm.patchValue({ 
              status: response.status,
              paidAt: response.paidAt ? new Date(response.paidAt) : null
            }, { emitEvent: false });
          }
          
          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: this.isPaid ? 'Invoice marked as paid' : 'Invoice marked as unpaid'
          });
        },
        error: (error) => {
          this.saving = false;
          this.isPaid = !this.isPaid; // Revert the toggle if the API call fails
          this.handleSaveError(error, 'Failed to update invoice status');
        }
      });
    }
  }
  
  // Check if invoice is overdue
  isOverdue(): boolean {
    const dueDate = this.invoiceForm.get('dueDate')?.value;
    if (!dueDate) return false;
    
    const today = new Date();
    return new Date(dueDate) < today;
  }
  
  // Get status display name
  getStatusLabel(status: string): string {
    switch(status) {
      case InvoiceStatus.DRAFT: return 'Draft';
      case InvoiceStatus.PENDING: return 'Pending';
      case InvoiceStatus.PAID: return 'Paid';
      case InvoiceStatus.OVERDUE: return 'Overdue';
      case InvoiceStatus.CANCELLED: return 'Cancelled';
      default: return status;
    }
  }
  
  // Get status severity for PrimeNG tag
  getStatusSeverity(status: string): 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'contrast' | undefined {
    switch(status) {
      case InvoiceStatus.DRAFT: return 'info';
      case InvoiceStatus.PENDING: return 'warning';
      case InvoiceStatus.PAID: return 'success';
      case InvoiceStatus.OVERDUE: return 'danger';
      case InvoiceStatus.CANCELLED: return 'secondary';
      default: return 'info';
    }
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
      totalAmount: invoice.totalAmount || 0,
      status: invoice.status || InvoiceStatus.DRAFT,
      paidAt: invoice.paidAt ? new Date(invoice.paidAt) : null,
      currency: invoice.currency || 'USD',
      exchangeRate: invoice.exchangeRate || 1
    });

    // If companyName and companyAddress are empty or not provided,
    // try to populate them from the client information
    if (typeof invoice.client === 'object' && invoice.client) {
      const selectedClient = invoice.client as Client;
      let formattedAddress = '';
      
      if (typeof selectedClient.address === 'object' && selectedClient.address) {
        const address = selectedClient.address;
        // Format as: street, city, state zipCode, country
        formattedAddress = [
          address.street,
          [address.city, address.state, address.zipCode].filter(Boolean).join(' '),
          address.country
        ].filter(Boolean).join(', ');
      } else if (selectedClient.address) {
        formattedAddress = selectedClient.address;
      } else {
        // Try to construct from individual fields if available
        const addressParts = [
          selectedClient.address,
          [selectedClient.city, selectedClient.state, selectedClient.zipCode].filter(Boolean).join(' '),
          selectedClient.country
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          formattedAddress = addressParts.join(', ');
        }
      }
      
      this.invoiceForm.patchValue({
        companyName: invoice.companyName || selectedClient.companyName || selectedClient.name || '',
        companyAddress: invoice.companyAddress || formattedAddress || ''
      });
    } else {
      // If no client object is available, use whatever was in the invoice
      this.invoiceForm.patchValue({
        companyName: invoice.companyName || '',
        companyAddress: invoice.companyAddress || ''
      });
    }
    
    // Set the paid status flag
    this.isPaid = invoice.status === InvoiceStatus.PAID;
    
    // Store client info for email
    if (typeof invoice.client === 'object') {
      this.clientName = invoice.client.name;
      this.clientEmail = invoice.client.email || '';
    }
    
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
        this.setupItemListeners(itemGroup);
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
        const fallbackNumber = `INV-${new Date().getTime()}`;
        this.invoiceForm.patchValue({ invoiceNumber: fallbackNumber });
        this.messageService.add({
          severity: 'warn',
          summary: 'Invoice Number',
          detail: 'Using generated fallback invoice number'
        });
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
      // Skip autosave if the invoice is in a finalized state (Paid or Cancelled)
      const currentStatus = this.invoiceForm.get('status')?.value;
      if (currentStatus === InvoiceStatus.PAID || currentStatus === InvoiceStatus.CANCELLED) {
        return;
      }
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
    
    // Skip autosave if the invoice is in a finalized state (Paid or Cancelled)
    const currentStatus = this.invoiceForm.get('status')?.value;
    if (this.isEditMode && this.invoiceId && (currentStatus === InvoiceStatus.PAID || currentStatus === InvoiceStatus.CANCELLED)) {
      return;
    }
    
    this.autoSaving = true;
    
    // Prepare data for saving
    let invoiceData;
    try {
      invoiceData = this.prepareFormData();
    } catch (err) {
      this.autoSaving = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Autosave Error',
        detail: 'Failed to prepare form data for autosave'
      });
      return;
    }
    
    // For new invoices, set status to Draft explicitly
    if (!this.isEditMode || !this.invoiceId) {
      invoiceData.status = InvoiceStatus.DRAFT;
    }
    
    // Save as draft - use the service methods which wrap the data in invoiceDto property
    const saveOperation = this.isEditMode && this.invoiceId 
      ? this.invoiceService.updateInvoice(this.invoiceId, invoiceData) 
      : this.invoiceService.createInvoice(invoiceData);
        
      saveOperation.pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.lastSaved = new Date();
          this.autoSaving = false;
          
          // Safety check for response
          if (!response) {
            // Empty response from save operation, nothing to do
            return;
          }
          
          if (!this.isEditMode && !this.invoiceId && response.id) {
            // If this was a new invoice, switch to edit mode
            this.isEditMode = true;
            this.invoiceId = response.id;
            
            // Update URL without reloading (replace state)
            const url = this.router.createUrlTree(['/invoices', response.id, 'edit']).toString();
            window.history.replaceState({}, '', url);
          }
        },
        error: (error) => {
          this.autoSaving = false;
          // Silent fail for autosave - we don't want to disrupt the user
        },
        complete: () => {
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
    
    // Set the status explicitly to Draft
    invoiceData.status = InvoiceStatus.DRAFT;
    
    // Use the service methods which will wrap the data in invoiceDto property
    const saveOperation = this.isEditMode && this.invoiceId 
      ? this.invoiceService.updateInvoice(this.invoiceId, invoiceData) 
      : this.invoiceService.createInvoice(invoiceData);
      
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
        this.handleSaveError(error, 'Failed to save draft. Please try again.');
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
    
    const clientId = this.invoiceForm.get('clientId')?.value;
    if (clientId) {
      // Get client details for email
      const client = this.clients.find(c => c.id === clientId);
      if (client) {
        this.clientName = client.name;
        this.clientEmail = client.email || '';
      }
    }
    
    // Show email preview before saving and sending
    this.showEmailPreview = true;
  }
  
  // Helper method to send email directly without updating invoice
  private sendDirectEmail(invoiceId: number): void {
    this.invoiceService.sendInvoiceEmail(invoiceId, this.clientEmail).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Invoice sent via email'
        });
        
        // Navigate back to invoice list
        setTimeout(() => this.router.navigate(['/invoices']), 500);
      },
      error: (error) => {
        this.saving = false;
        this.messageService.add({
          severity: 'warn',
          summary: 'Email Failed',
          detail: 'Failed to send email. Please try again.'
        });
      }
    });
  }

  sendEmail(): void {
    // Hide preview and proceed with saving
    this.showEmailPreview = false;
    
    this.saving = true;
    
    // Check if invoice is already in a finalized state (Paid or Cancelled)
    const currentStatus = this.invoiceForm.get('status')?.value;
    const isFinalized = currentStatus === InvoiceStatus.PAID || currentStatus === InvoiceStatus.CANCELLED;
    
    // If the invoice is already finalized, skip the update and just send the email
    if (this.isEditMode && this.invoiceId && isFinalized) {
      this.sendDirectEmail(this.invoiceId);
      return;
    }
    
    try {
      const invoiceData = this.prepareFormData();
      
      // If the status is already set to PAID in the form, preserve that status
      // Otherwise for non-finalized invoices, set to PENDING when sending
      if (!isFinalized && this.invoiceForm.get('status')?.value !== InvoiceStatus.PAID) {
        invoiceData.status = InvoiceStatus.PENDING;
      }
      
      // Use the service methods to send data directly to the backend
      const saveOperation = this.isEditMode && this.invoiceId 
        ? this.invoiceService.updateInvoice(this.invoiceId, invoiceData) 
        : this.invoiceService.createInvoice(invoiceData);
        
      saveOperation.pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          // Ensure we have a valid invoice ID
          // Get invoice ID either from the response or use the existing one
          const invoiceId = response && response.id ? response.id : this.invoiceId;
          
          if (!invoiceId) {
            this.saving = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Invoice saved but could not get ID for email sending'
            });
            return;
          }
          
          // Send email with invoice PDF
          this.invoiceService.sendInvoiceEmail(invoiceId, this.clientEmail).pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            next: () => {
              this.saving = false;
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Invoice saved and sent via email'
              });
              
              // Navigate back to invoice list
              setTimeout(() => this.router.navigate(['/invoices']), 500);
            },
            error: (error) => {
              this.saving = false;
              this.messageService.add({
                severity: 'warn',
                summary: 'Email Failed',
                detail: 'Invoice was saved but email sending failed'
              });
              // Still navigate back to invoice list
              setTimeout(() => this.router.navigate(['/invoices']), 500);
            }
          });
        },
        error: (error) => {
          this.handleSaveError(error, 'Failed to save invoice. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error preparing invoice data:', error);
      this.saving = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to prepare invoice data. Please check all fields and try again.'
      });
    }
  }

  // Helper to prepare form data for submission
  private prepareFormData(): any {
    const formValue = this.invoiceForm.value;
    
    // Ensure clientId is a number and not null
    const clientId = Number(formValue.clientId);
    if (!clientId || isNaN(clientId)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please select a valid client'
      });
      throw new Error('Invalid client selection');
    }
    
    // Use status directly - we'll let the invoice service handle the mapping
    // The form status should be the string enum value (InvoiceStatus.DRAFT etc.)
    const statusValue = formValue.status || InvoiceStatus.DRAFT;
    
    // Prepare the data according to what the backend expects (CreateInvoiceDto or UpdateInvoiceDto)
    return {
      id: this.invoiceId || 0, // Include ID for updates, omit or set to 0 for new invoices
      clientId: clientId, // Ensure this is a valid number
      issueDate: formValue.issueDate,
      dueDate: formValue.dueDate,
      taxRate: formValue.taxRate || 0,
      notes: formValue.notes || '',
      // Use the numeric value for status that matches backend enum
      status: statusValue,
      // Map items to match InvoiceItemDto structure
      items: formValue.items.map((item: any) => ({
        id: item.id || 0, // Include ID for existing items, use 0 for new items
        invoiceId: this.invoiceId || 0, // Use 0 for new invoices
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
    const currency = this.invoiceForm?.get('currency')?.value || 'USD';
    const currencyInfo = this.currencies.find(c => c.code === currency);
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  }
  
  // Download invoice as PDF
  downloadPdf(): void {
    if (!this.invoiceId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please save the invoice first'
      });
      return;
    }
    
    this.invoiceService.downloadInvoicePdf(this.invoiceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Invoice_${this.invoiceForm.get('invoiceNumber')?.value}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'PDF downloaded successfully'
          });
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to download PDF'
          });
        }
      });
  }
  
  // Helper method to handle save errors consistently
  private handleSaveError(error: any, message: string = 'Failed to save invoice'): void {
    console.error('Save error:', error);
    this.saving = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }
} 