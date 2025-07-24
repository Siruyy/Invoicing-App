import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { DropdownModule } from 'primeng/dropdown';

// Components
import { CardComponent } from '../../shared/components/card/card.component';

// Services and models
import { ClientService } from '../../core/services/client.service';
import { Client } from '../../core/models/client.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    DividerModule,
    RippleModule,
    DropdownModule,
    CardComponent
  ],
  providers: [
    MessageService,
    ConfirmationService
  ],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss'
})
export class ClientFormComponent implements OnInit, OnDestroy {
  clientForm!: FormGroup;
  isEditMode = false;
  clientId?: number;
  loading = true;
  saving = false;
  countries: { name: string; code: string }[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Check if we're in edit mode
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.clientId = +id;
        this.loadClient(+id);
      } else {
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Load countries list for dropdown
  private loadCountries(): void {
    this.countries = [
      { name: 'United States', code: 'US' },
      { name: 'Canada', code: 'CA' },
      { name: 'United Kingdom', code: 'GB' },
      { name: 'Australia', code: 'AU' },
      { name: 'Germany', code: 'DE' },
      { name: 'France', code: 'FR' },
      { name: 'Spain', code: 'ES' },
      { name: 'Italy', code: 'IT' },
      { name: 'Japan', code: 'JP' },
      { name: 'China', code: 'CN' },
      { name: 'India', code: 'IN' },
      { name: 'Brazil', code: 'BR' },
      { name: 'Mexico', code: 'MX' },
      { name: 'South Africa', code: 'ZA' },
      { name: 'Nigeria', code: 'NG' },
      { name: 'Egypt', code: 'EG' },
      { name: 'Singapore', code: 'SG' },
      { name: 'New Zealand', code: 'NZ' },
      { name: 'Netherlands', code: 'NL' },
      { name: 'Sweden', code: 'SE' },
      { name: 'Switzerland', code: 'CH' }
    ];
  }

  // Initialize the form
  private initForm(): void {
    this.loadCountries();
    
    this.clientForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      companyName: [''],
      contactPerson: [''],
      taxNumber: [''],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: ['']
      }),
      notes: ['']
    });
  }

  // Load client data when in edit mode
  private loadClient(id: number): void {
    this.clientService.getClientById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (client) => {
        this.populateForm(client);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading client', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load client information'
        });
        this.loading = false;
      }
    });
  }

  // Populate form with client data
  private populateForm(client: any): void {
    // Handle both frontend model and backend DTO formats
    const address = client.address || {};
    let street = '', city = '', state = '', zipCode = '', country = '';
    
    // Check if address is a string (backend format) or an object (frontend format)
    if (typeof client.address === 'string') {
      // Backend format with separate fields
      street = client.address || '';
      city = client.city || '';
      state = client.state || '';
      zipCode = client.zipCode || '';
      country = client.country || '';
    } else if (client.address) {
      // Frontend format with nested address object
      street = client.address.street || '';
      city = client.address.city || '';
      state = client.address.state || '';
      zipCode = client.address.zipCode || '';
      country = client.address.country || '';
    }
    
    this.clientForm.patchValue({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      companyName: client.companyName || '',
      contactPerson: client.contactPerson || '',
      taxNumber: client.taxNumber || '',
      address: {
        street: street,
        city: city,
        state: state,
        zipCode: zipCode,
        country: country
      },
      notes: client.notes || ''
    });
  }

  // Form submission
  saveClient(): void {
    if (!this.clientForm.valid) {
      this.markFormGroupTouched(this.clientForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly'
      });
      return;
    }
    
    this.saving = true;
    const clientData = this.prepareFormData();
    
    const saveOperation = this.isEditMode && this.clientId
      ? this.clientService.updateClient(this.clientId, clientData)
      : this.clientService.createClient(clientData);
      
    saveOperation.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Client ${this.isEditMode ? 'updated' : 'created'} successfully`
        });
        
        // Navigate back to clients list
        setTimeout(() => this.router.navigate(['/clients']), 1000);
      },
      error: (error) => {
        console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} client`, error);
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to ${this.isEditMode ? 'update' : 'create'} client`
        });
      }
    });
  }

  // Prepare the form data for submission
  private prepareFormData(): any {
    const formValue = this.clientForm.value;
    const addressObj = formValue.address || {};
    
    // Transform the data to match the backend DTO structure
    return {
      id: this.clientId,
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone || '',
      companyName: formValue.companyName || '',
      contactPerson: formValue.contactPerson || '',
      taxNumber: formValue.taxNumber || '',
      address: addressObj.street || '',
      city: addressObj.city || '',
      state: addressObj.state || '',
      zipCode: addressObj.zipCode || '',
      country: addressObj.country || '',
      notes: formValue.notes || ''
    };
  }

  // Helper to validate all form controls
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Cancel form editing
  confirmCancel(): void {
    if (this.clientForm.dirty) {
      this.confirmationService.confirm({
        message: 'You have unsaved changes. Are you sure you want to leave?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.router.navigate(['/clients']);
        }
      });
    } else {
      this.router.navigate(['/clients']);
    }
  }
} 