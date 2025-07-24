import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

// Components
import { CardComponent } from '../../shared/components/card/card.component';

// Services and models
import { ClientService } from '../../core/services/client.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { Client } from '../../core/models/client.model';
import { Invoice } from '../../core/models/invoice.model';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    DividerModule,
    CardModule,
    TagModule,
    CardComponent
  ],
  providers: [
    MessageService,
    ConfirmationService
  ],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss'
})
export class ClientDetailComponent implements OnInit, OnDestroy {
  client: Client | null = null;
  clientInvoices: Invoice[] = [];
  loading = true;
  loadingInvoices = true;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private clientService: ClientService,
    private invoiceService: InvoiceService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadClient(+id);
        this.loadClientInvoices(+id);
      } else {
        this.error = 'Invalid client ID';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClient(id: number): void {
    this.loading = true;
    this.clientService.getClientById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (client) => {
        this.client = client;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading client', error);
        this.error = 'Failed to load client information';
        this.loading = false;
      }
    });
  }

  loadClientInvoices(clientId: number): void {
    this.loadingInvoices = true;
    this.invoiceService.getInvoices(1, 1000, undefined, clientId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.clientInvoices = response.items;
        this.loadingInvoices = false;
      },
      error: (error) => {
        console.error('Error loading client invoices', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load client invoices'
        });
        this.loadingInvoices = false;
      }
    });
  }

  editClient(): void {
    if (this.client?.id) {
      this.router.navigate(['/clients', this.client.id, 'edit']);
    }
  }

  createInvoice(): void {
    // Navigate to new invoice page with client pre-selected
    if (this.client?.id) {
      this.router.navigate(['/invoices/new'], { 
        queryParams: { clientId: this.client.id } 
      });
    }
  }

  confirmDeleteClient(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this client? This action cannot be undone.',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteClient();
      }
    });
  }

  deleteClient(): void {
    if (!this.client?.id) return;
    
    this.clientService.deleteClient(this.client.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Client deleted successfully'
        });
        
        // Navigate back to clients list
        setTimeout(() => this.router.navigate(['/clients']), 1000);
      },
      error: (error) => {
        console.error('Error deleting client', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete client'
        });
      }
    });
  }

  getStatusSeverity(status: string): "success" | "warning" | "danger" | "info" | undefined {
    switch (status) {
      case 'PAID':
        return "success";
      case 'PENDING':
        return "warning";
      case 'OVERDUE':
        return "danger";
      case 'DRAFT':
        return "info";
      case 'CANCELLED':
        return "secondary" as any; // Cast to any for backward compatibility
      default:
        return "info";
    }
  }
  
  // Helper method to check if the address is an object with nested properties
  // Using TypeScript type predicate for better type checking
  isAddressObject(address: any): address is {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } {
    return address && typeof address === 'object' && 
           ('street' in address || 'city' in address || 
            'state' in address || 'zipCode' in address || 
            'country' in address);
  }
} 