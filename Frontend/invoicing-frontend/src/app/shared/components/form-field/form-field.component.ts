import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-4">
      <label 
        *ngIf="label" 
        [for]="id" 
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </label>
      
      <ng-content></ng-content>
      
      <div *ngIf="control && control.invalid && (control.dirty || control.touched)" class="mt-1">
        <!-- Default error messages -->
        <div *ngIf="control.errors?.['required']" class="text-sm text-red-600">
          This field is required
        </div>
        <div *ngIf="control.errors?.['email']" class="text-sm text-red-600">
          Please enter a valid email address
        </div>
        <div *ngIf="control.errors?.['minlength']" class="text-sm text-red-600">
          This field must be at least {{ control.errors?.['minlength'].requiredLength }} characters
        </div>
        <div *ngIf="control.errors?.['maxlength']" class="text-sm text-red-600">
          This field cannot be more than {{ control.errors?.['maxlength'].requiredLength }} characters
        </div>
        <div *ngIf="control.errors?.['pattern']" class="text-sm text-red-600">
          Please enter a valid format
        </div>
        <div *ngIf="control.errors?.['min']" class="text-sm text-red-600">
          Value must be greater than or equal to {{ control.errors?.['min'].min }}
        </div>
        <div *ngIf="control.errors?.['max']" class="text-sm text-red-600">
          Value must be less than or equal to {{ control.errors?.['max'].max }}
        </div>
        
        <!-- Custom error message -->
        <div *ngIf="errorMessage" class="text-sm text-red-600">
          {{ errorMessage }}
        </div>
      </div>
      
      <!-- Help text -->
      <div *ngIf="helpText" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ helpText }}
      </div>
    </div>
  `,
  styles: ``
})
export class FormFieldComponent {
  @Input() label?: string;
  @Input() id?: string;
  @Input() required = false;
  @Input() control?: AbstractControl | null;
  @Input() errorMessage?: string;
  @Input() helpText?: string;
} 