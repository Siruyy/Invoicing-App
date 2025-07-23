import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicPipePipe } from '../../pipes/dynamic-pipe.pipe';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, InputTextModule, DynamicPipePipe],
  template: `
    <div class="card">
      <div class="flex justify-between items-center mb-4" *ngIf="showHeader">
        <!-- Title -->
        <div>
          <h2 *ngIf="title" class="text-lg font-medium text-gray-900 dark:text-white">{{ title }}</h2>
          <p *ngIf="subtitle" class="text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
        </div>
        
        <!-- Global search -->
        <div class="flex items-center" *ngIf="globalFilter">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input 
              pInputText 
              type="text" 
              #filter
              (input)="onGlobalFilter(filter.value)" 
              placeholder="Search..."
              class="p-inputtext-sm"
            />
          </span>
        </div>
      </div>
      
      <p-table
        #dt
        [value]="data"
        [columns]="columns"
        [paginator]="paginator"
        [rows]="rows"
        [rowsPerPageOptions]="rowsPerPageOptions"
        [showCurrentPageReport]="showCurrentPageReport"
        [totalRecords]="totalRecords"
        [rowHover]="true"
        [loading]="loading"
        [resizableColumns]="resizableColumns"
        [reorderableColumns]="reorderableColumns"
        [sortMode]="sortMode"
        [sortField]="sortField"
        [sortOrder]="sortOrder"
        (onSort)="onSortChange.emit($event)"
        (onPage)="onPageChange.emit($event)"
        styleClass="p-datatable-sm"
        responsiveLayout="stack"
        [breakpoint]="'960px'"
        [tableStyle]="{ 'min-width': '50rem' }"
      >
        <!-- Header -->
        <ng-template pTemplate="header" let-columns>
          <tr>
            <th *ngFor="let col of columns" [pSortableColumn]="col.sortable ? col.field : null" [style.width]="col.width">
              {{ col.header }}
              <p-sortIcon *ngIf="col.sortable" [field]="col.field"></p-sortIcon>
            </th>
            <th *ngIf="actionTemplate" style="width: 100px">Actions</th>
          </tr>
        </ng-template>
        
        <!-- Body -->
        <ng-template pTemplate="body" let-rowData let-columns="columns">
          <tr>
            <td *ngFor="let col of columns">
              <span class="p-column-title">{{ col.header }}</span>
              
              <!-- Use custom cell template if provided -->
              <ng-container *ngIf="col.template; else defaultCell">
                <ng-container 
                  [ngTemplateOutlet]="col.template" 
                  [ngTemplateOutletContext]="{ $implicit: rowData, field: col.field }"
                ></ng-container>
              </ng-container>
              
              <!-- Default cell rendering -->
              <ng-template #defaultCell>
                {{ col.pipe ? (getNestedValue(rowData, col.field) | dynamicPipe: col.pipe) : getNestedValue(rowData, col.field) }}
              </ng-template>
            </td>
            
            <!-- Actions column -->
            <td *ngIf="actionTemplate">
              <ng-container 
                [ngTemplateOutlet]="actionTemplate" 
                [ngTemplateOutletContext]="{ $implicit: rowData }"
              ></ng-container>
            </td>
          </tr>
        </ng-template>
        
        <!-- Empty state -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="columns.length + (actionTemplate ? 1 : 0)" class="text-center p-4">
              <div class="flex flex-col items-center py-6">
                <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
                <span class="text-gray-500">{{ emptyMessage }}</span>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: ``
})
export class DataTableComponent<T> {
  @Input() data: T[] = [];
  @Input() columns: Array<{
    field: string;
    header: string;
    sortable?: boolean;
    width?: string;
    pipe?: string;
    template?: TemplateRef<any>;
  }> = [];
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showHeader = true;
  @Input() globalFilter = true;
  @Input() paginator = true;
  @Input() rows = 10;
  @Input() rowsPerPageOptions = [5, 10, 25, 50];
  @Input() showCurrentPageReport = true;
  @Input() totalRecords = 0;
  @Input() loading = false;
  @Input() resizableColumns = false;
  @Input() reorderableColumns = false;
  @Input() sortMode = 'single';
  @Input() sortField = '';
  @Input() sortOrder = 1;
  @Input() emptyMessage = 'No records found';

  @ContentChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  @Output() onSortChange = new EventEmitter<any>();
  @Output() onPageChange = new EventEmitter<any>();
  @Output() onFilterChange = new EventEmitter<string>();

  onGlobalFilter(value: string) {
    this.onFilterChange.emit(value);
  }

  // Handle nested object properties (e.g., 'client.name')
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, i) => (o ? o[i] : null), obj);
  }
} 