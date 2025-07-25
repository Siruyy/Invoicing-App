import { Pipe, PipeTransform } from '@angular/core';
import { Client } from '../../core/models/client.model';

@Pipe({
  name: 'safeClient',
  standalone: true
})
export class SafeClientPipe implements PipeTransform {
  transform(client: Client | number | null | undefined): string {
    if (!client) {
      return 'Unknown Client';
    }
    
    // If client is just an ID (number)
    if (typeof client === 'number') {
      return `Client #${client}`;
    }
    
    // If client is an object with a name property
    if (typeof client === 'object' && client.name) {
      return client.name;
    }
    
    return 'Unknown Client';
  }
}
