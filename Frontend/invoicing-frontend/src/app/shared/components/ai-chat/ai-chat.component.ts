import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject, takeUntil } from 'rxjs';
import { AiChatMessage, AiQueryService } from '../../../core/services/ai-query.service';
import { FormatContentPipe } from '../../pipes/format-content.pipe';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    ReactiveFormsModule,
    ProgressSpinnerModule,
    FormatContentPipe
  ],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss']
})
export class AiChatComponent implements OnInit, OnDestroy {
  visible = false;
  minimized = false;
  messages: AiChatMessage[] = [];
  loading = false;
  
  // Dynamic dialog styles based on minimized state
  get dialogStyle(): object {
    return {
      width: '450px', 
      minWidth: '400px',
      minHeight: this.minimized ? 'auto' : '600px', // Reduced to match content height
      height: this.minimized ? 'auto' : '600px',    // Reduced to match content height
      transition: 'height 0.3s ease, min-height 0.3s ease',
      overflow: 'hidden' // Ensure no scrolling on the dialog itself
    };
  }
  
  @ViewChild('messageContainer') messageContainer?: ElementRef;
  
  chatForm = new FormGroup({
    query: new FormControl('', [Validators.required])
  });
  
  examplePrompts = [
    "Which clients show signs of churn risk?",
    "Suggest products to cross-sell to client ABC",
    "Show me clients with declining invoice volume",
    "Which clients have delayed payments recently?"
  ];
  
  private destroy$ = new Subject<void>();

  constructor(private aiQueryService: AiQueryService) { }

  ngOnInit(): void {
    this.loadChatHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChat(): void {
    this.visible = !this.visible;
    console.log('Toggle chat visibility:', this.visible);
    // When opening, ensure we're not minimized
    if (this.visible) {
      this.minimized = false;
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }
  
  closeChat(): void {
    // Explicitly set visible to false without toggling
    this.visible = false;
    console.log('Close chat: setting visibility to false');
  }
  
  minimizeChat(): void {
    this.minimized = true;
    console.log('Chat minimized:', this.minimized);
  }
  
  maximizeChat(): void {
    this.minimized = false;
    console.log('Chat maximized');
    // Wait for transition to complete before scrolling
    setTimeout(() => this.scrollToBottom(), 300);
  }

  sendMessage(): void {
    if (this.chatForm.invalid || this.loading) {
      return;
    }
    
    const query = this.chatForm.get('query')?.value || '';
    if (!query.trim()) {
      return;
    }
    
    // Add user message to the UI immediately
    this.addUserMessage(query);
    
    // Clear the input
    this.chatForm.get('query')?.reset();
    
    // Show loading state and disable input
    this.loading = true;
    this.chatForm.get('query')?.disable();
    
    // Send to AI service
    this.aiQueryService.processQuery(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Add AI response to the UI
          if (response.success) {
            this.addAiMessage(response.response);
          } else {
            this.addAiMessage(`Sorry, I encountered an error: ${response.error || 'Unknown error'}`);
          }
          this.loading = false;
          // Re-enable the query input
          this.chatForm.get('query')?.enable();
        },
        error: (error) => {
          console.error('Error processing query:', error);
          this.addAiMessage('Sorry, I encountered an error processing your request.');
          this.loading = false;
          // Re-enable the query input
          this.chatForm.get('query')?.enable();
        }
      });
  }
  
  useExamplePrompt(prompt: string): void {
    this.chatForm.get('query')?.setValue(prompt);
    this.sendMessage();
  }
  
  clearChat(): void {
    this.aiQueryService.clearChatHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messages = [];
        },
        error: (error) => {
          console.error('Error clearing chat history:', error);
        }
      });
  }
  
  private loadChatHistory(): void {
    this.loading = true;
    // Disable the query input while loading
    this.chatForm.get('query')?.disable();
    
    this.aiQueryService.getChatHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.loading = false;
          // Re-enable the query input after loading
          this.chatForm.get('query')?.enable();
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Error loading chat history:', error);
          this.loading = false;
          // Re-enable the query input after error
          this.chatForm.get('query')?.enable();
          // Show an empty chat interface rather than crashing
          this.messages = [];
        }
      });
  }
  
  private addUserMessage(content: string): void {
    const message: AiChatMessage = {
      id: this.messages.length + 1,
      userId: 'default-user',
      isUserMessage: true,
      content,
      createdAt: new Date()
    };
    this.messages.push(message);
    setTimeout(() => this.scrollToBottom(), 100);
  }
  
  private addAiMessage(content: string): void {
    const message: AiChatMessage = {
      id: this.messages.length + 1,
      userId: 'default-user',
      isUserMessage: false,
      content,
      createdAt: new Date()
    };
    this.messages.push(message);
    setTimeout(() => this.scrollToBottom(), 100);
  }
  
  private scrollToBottom(): void {
    if (this.messageContainer) {
      const element = this.messageContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}
