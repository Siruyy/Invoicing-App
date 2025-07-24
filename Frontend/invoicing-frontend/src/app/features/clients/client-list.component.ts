import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
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
    RippleModule
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
} 