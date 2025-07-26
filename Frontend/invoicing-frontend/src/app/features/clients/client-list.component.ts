import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';

// Components
import { CardComponent } from '../../shared/components/card/card.component';

// Services and models
import { ClientService } from '../../core/services/client.service';
import { Client } from '../../core/models/client.model';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule,
    CardComponent,
    TooltipModule,
    RippleModule,
    DialogModule,
    CheckboxModule,
    FileUploadModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss'
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  loading = true;
  globalFilter: string = '';
  
  // Dialog display flags
  showImportDialog: boolean = false;
  
  // Import related properties
  uploadedFile: File | null = null;
  importInProgress: boolean = false;

  constructor(
    private clientService: ClientService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.clientService.getClients().subscribe({
      next: (response) => {
        this.clients = response.items;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading clients', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load clients'
        });
        this.loading = false;
      }
    });
  }

  editClient(client: Client): void {
    this.router.navigate(['/clients', client.id, 'edit']);
  }

  viewClient(client: Client): void {
    this.router.navigate(['/clients', client.id]);
  }

  confirmDeleteClient(event: Event, client: Client): void {
    event.stopPropagation();
    
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${client.name}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteClient(client);
      }
    });
  }

  deleteClient(client: Client): void {
    if (!client.id) return;
    
    this.clientService.deleteClient(client.id).subscribe({
      next: () => {
        this.clients = this.clients.filter(c => c.id !== client.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Client deleted successfully'
        });
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
  
  // Import Dialog Methods
  openImportDialog(): void {
    this.uploadedFile = null;
    this.showImportDialog = true;
  }
  
  closeImportDialog(): void {
    this.showImportDialog = false;
    this.uploadedFile = null;
  }
  
  onFileSelected(event: any): void {
    if (event.files && event.files.length > 0) {
      this.uploadedFile = event.files[0];
    }
  }
  
  importClients(): void {
    if (!this.uploadedFile) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a CSV file to import'
      });
      return;
    }
    
    this.importInProgress = true;
    
    this.clientService.importClientsFromCsv(this.uploadedFile).subscribe({
      next: (result) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Successfully imported ${result.imported} clients`
        });
        this.closeImportDialog();
        this.loadClients(); // Reload the client list
        this.importInProgress = false;
      },
      error: (error) => {
        console.error('Error importing clients', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to import clients'
        });
        this.importInProgress = false;
      }
    });
  }
  
  // Export all clients directly
  openExportDialog(): void {
    this.exportClients();
  }
  
  exportClients(): void {
    console.log('Starting direct client export...');
    
    // Show loading message
    this.messageService.add({
      severity: 'info',
      summary: 'Export',
      detail: 'Preparing client export...',
      life: 2000
    });

    // Direct approach: open the URL in a new tab/window
    const exportUrl = `${environment.apiUrl}/clients/export`;
    window.open(exportUrl, '_blank');
    
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Export started. If download doesn\'t begin automatically, check your browser settings.'
    });
  }
} 