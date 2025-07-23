import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MainLayoutComponent],
  template: `<app-main-layout></app-main-layout>`,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Invoicing Application';
}
