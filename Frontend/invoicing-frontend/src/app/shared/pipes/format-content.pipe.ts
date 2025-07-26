import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'formatContent',
  standalone: true
})
export class FormatContentPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    
    // Convert newlines to <br> tags
    let formattedValue = value.replace(/\n/g, '<br>');
    
    return this.sanitizer.bypassSecurityTrustHtml(formattedValue);
  }
}
