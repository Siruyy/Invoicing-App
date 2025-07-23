import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <button
      pButton
      [type]="type"
      [label]="label"
      [icon]="icon"
      [iconPos]="iconPos"
      [loading]="loading"
      [disabled]="disabled"
      [class]="getButtonClass()"
      (onClick)="onClick.emit($event)"
    ></button>
  `,
  styles: ``
})
export class ButtonComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() iconPos: 'left' | 'right' | 'top' | 'bottom' = 'left';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'text' = 'primary';
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() fullWidth = false;

  @Output() onClick = new EventEmitter<Event>();

  getButtonClass(): string {
    const classes = ['p-button-rounded'];

    // Variant classes
    switch (this.variant) {
      case 'primary':
        // Default PrimeNG button is already primary
        break;
      case 'secondary':
        classes.push('p-button-secondary');
        break;
      case 'success':
        classes.push('p-button-success');
        break;
      case 'danger':
        classes.push('p-button-danger');
        break;
      case 'warning':
        classes.push('p-button-warning');
        break;
      case 'info':
        classes.push('p-button-info');
        break;
      case 'text':
        classes.push('p-button-text');
        break;
    }

    // Size classes
    switch (this.size) {
      case 'small':
        classes.push('p-button-sm');
        break;
      case 'large':
        classes.push('p-button-lg');
        break;
    }

    // Full width
    if (this.fullWidth) {
      classes.push('w-full');
    }

    return classes.join(' ');
  }
} 