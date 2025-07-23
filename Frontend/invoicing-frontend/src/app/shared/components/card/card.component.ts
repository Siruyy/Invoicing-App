import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all shadow-sm hover:shadow-md dark:shadow-gray-900"
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
  styles: `
    div {
      transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
  `
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() noPadding = false;
} 