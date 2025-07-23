import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';

@Pipe({
  name: 'dynamicPipe',
  standalone: true
})
export class DynamicPipePipe implements PipeTransform {
  constructor(
    private currencyPipe: CurrencyPipe,
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe,
    private percentPipe: PercentPipe
  ) {}

  transform(value: any, pipeName: string, ...args: any[]): any {
    if (!pipeName || value === null || value === undefined) {
      return value;
    }

    // Parse the pipe name and arguments
    const [pipe, ...pipeArgs] = pipeName.split(':');
    
    // Handle different pipe types
    switch (pipe) {
      case 'date':
        return this.datePipe.transform(value, pipeArgs[0] || 'mediumDate');
      
      case 'currency':
        return this.currencyPipe.transform(
          value, 
          pipeArgs[0] || 'USD', 
          pipeArgs[1] !== 'false',
          pipeArgs[2] || '1.2-2'
        );
      
      case 'number':
        return this.decimalPipe.transform(value, pipeArgs[0] || '1.0-0');
      
      case 'percent':
        return this.percentPipe.transform(value, pipeArgs[0] || '1.0-0');
      
      case 'uppercase':
        return value.toUpperCase();
      
      case 'lowercase':
        return value.toLowerCase();
      
      case 'titlecase':
        return value.replace(/\w\S*/g, (txt: string) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      
      default:
        return value;
    }
  }
} 