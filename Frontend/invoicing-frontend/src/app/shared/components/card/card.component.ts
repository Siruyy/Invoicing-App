import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
      [ngClass]="{'p-6': !noPadding}"
    >
      <div *ngIf="title || subtitle" class="mb-4">
        <h2 *ngIf="title" class="text-lg font-medium text-gray-900 dark:text-gray-100">
          {{ title }}
        </h2>
        <p *ngIf="subtitle" class="text-sm text-gray-500 dark:text-gray-400">
          {{ subtitle }}
        </p>
      </div>
      
      <ng-content></ng-content>
    </div>
  `,
  styles: ``
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() noPadding = false;
} 