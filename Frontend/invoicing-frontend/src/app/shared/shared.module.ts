import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';

// Custom Components
import { CardComponent } from './components/card/card.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { ButtonComponent } from './components/button/button.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { FormFieldComponent } from './components/form-field/form-field.component';

// Pipes
import { DynamicPipePipe } from './pipes/dynamic-pipe.pipe';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    
    // PrimeNG Modules
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    DropdownModule,
    CalendarModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    CardModule,
    MenuModule,
    TooltipModule,
    ChartModule,
    
    // Standalone Components
    CardComponent,
    KpiCardComponent,
    ButtonComponent,
    DataTableComponent,
    FormFieldComponent,
    
    // Pipes
    DynamicPipePipe
  ],
  declarations: [],
  providers: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    PercentPipe
  ],
  exports: [
    // Angular Modules
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    
    // PrimeNG Modules
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    DropdownModule,
    CalendarModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    CardModule,
    MenuModule,
    TooltipModule,
    ChartModule,
    
    // Custom Components
    CardComponent,
    KpiCardComponent,
    ButtonComponent,
    DataTableComponent,
    FormFieldComponent,
    
    // Pipes
    DynamicPipePipe
  ]
})
export class SharedModule { } 