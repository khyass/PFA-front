import { Component, signal, inject, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AiService } from '../../core/services/ai.service';
import { ChatMessage } from '../../core/models/ai.models';

@Component({
  selector: 'app-interview-prep',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="chat-container">
      <a routerLink="/job-search" class="back-link">← Retour aux offres</a>

      <div class="chat-header">
        <h1 class="chat-title">🎯 Coach Entretien IA</h1>
        <p class="chat-subtitle" *ngIf="jobTitle()">
          {{ jobTitle() }} chez {{ companyName() }}
        </p>
      </div>

      <div class="chat-window" #chatWindow>
        <!-- Welcome message -->
        <div class="message assistant-message" *ngIf="messages().length === 0 && !isLoading()">
          <div class="message-avatar">🤖</div>
          <div class="message-bubble">
            <p>Bonjour ! Je suis votre coach d'entretien IA. Je vais vous aider à vous préparer pour ce poste.</p>
            <p>Vous pouvez me demander :</p>
            <ul>
              <li>De vous poser des questions techniques ou comportementales</li>
              <li>D'évaluer vos réponses et donner du feedback</li>
              <li>Des conseils sur un sujet spécifique</li>
            </ul>
            <p>Tapez votre message pour commencer ! 💬</p>
          </div>
        </div>

        <!-- Messages -->
        <div *ngFor="let msg of messages()" 
             class="message" 
             [class.user-message]="msg.role === 'user'" 
             [class.assistant-message]="msg.role === 'assistant'">
          <div class="message-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
          <div class="message-bubble">
            <p *ngFor="let paragraph of msg.content.split('\\n')" [innerHTML]="paragraph"></p>
          </div>
        </div>

        <!-- Loading indicator -->
        <div class="message assistant-message" *ngIf="isLoading()">
          <div class="message-avatar">🤖</div>
          <div class="message-bubble typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div class="error-banner" *ngIf="errorMessage()">
        <p>{{ errorMessage() }}</p>
      </div>

      <!-- Input -->
      <div class="chat-input-container">
        <textarea 
          class="chat-input"
          [(ngModel)]="userInput"
          (keydown.enter)="onEnter($event)"
          placeholder="Tapez votre message..."
          [disabled]="isLoading()"
          rows="1"
          #inputField
        ></textarea>
        <button class="send-btn" (click)="sendMessage()" [disabled]="isLoading() || !userInput.trim()">
          ➤
        </button>
      </div>

      <div class="disclaimer">
        ⚠️ Coach IA — les réponses sont générées automatiquement, utilisez-les comme guide de préparation.
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 80px);
    }

    .back-link { color: #667eea; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }

    .chat-header { margin-bottom: 1rem; flex-shrink: 0; }
    .chat-title { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0; }
    .chat-subtitle { color: #64748b; margin-top: 0.25rem; font-size: 1rem; }

    .chat-window {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message {
      display: flex;
      gap: 0.75rem;
      max-width: 85%;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .user-message {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .assistant-message {
      align-self: flex-start;
    }

    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
      background: #e2e8f0;
    }

    .message-bubble {
      padding: 0.75rem 1rem;
      border-radius: 12px;
      line-height: 1.5;
      font-size: 0.9rem;
    }

    .message-bubble p { margin: 0 0 0.5rem 0; }
    .message-bubble p:last-child { margin-bottom: 0; }
    .message-bubble ul { margin: 0.5rem 0; padding-left: 1.25rem; }
    .message-bubble li { margin-bottom: 0.25rem; }

    .user-message .message-bubble {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .assistant-message .message-bubble {
      background: white;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      border-bottom-left-radius: 4px;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 1rem 1.25rem;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #94a3b8;
      border-radius: 50%;
      animation: bounce 1.4s ease-in-out infinite;
    }

    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 0.75rem;
      font-size: 0.85rem;
      text-align: center;
      flex-shrink: 0;
    }

    .chat-input-container {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
      flex-shrink: 0;
    }

    .chat-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.9rem;
      resize: none;
      outline: none;
      font-family: inherit;
      line-height: 1.4;
      max-height: 120px;
      transition: border-color 0.2s;
    }

    .chat-input:focus { border-color: #667eea; }
    .chat-input:disabled { background: #f1f5f9; }

    .send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s, transform 0.2s;
      flex-shrink: 0;
    }

    .send-btn:hover:not(:disabled) { transform: scale(1.05); }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .disclaimer {
      margin-top: 0.75rem;
      padding: 0.5rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      color: #92400e;
      font-size: 0.75rem;
      text-align: center;
      flex-shrink: 0;
    }

    @media (max-width: 640px) {
      .chat-container { padding: 1rem; height: calc(100vh - 60px); }
      .message { max-width: 92%; }
    }
  `]
})
export class InterviewPrepComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatWindow') private chatWindow!: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly aiService = inject(AiService);

  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly jobTitle = signal('');
  protected readonly companyName = signal('');

  protected userInput = '';
  private offerId = '';
  private shouldScroll = false;

  ngOnInit(): void {
    this.offerId = this.route.snapshot.paramMap.get('offerId') || '';
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.sendMessage();
  }

  sendMessage(): void {
    const message = this.userInput.trim();
    if (!message || this.isLoading()) return;

    // Get history before adding the new user message
    const history = [...this.messages()];

    // Add user message to UI
    this.messages.update(msgs => [...msgs, { role: 'user', content: message }]);
    this.userInput = '';
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.shouldScroll = true;

    // Send to API with previous history
    this.aiService.interviewChat(this.offerId, message, history).subscribe({
      next: (response) => {
        this.jobTitle.set(response.jobTitle);
        this.companyName.set(response.companyName);
        this.messages.update(msgs => [...msgs, { role: 'assistant', content: response.reply }]);
        this.isLoading.set(false);
        this.shouldScroll = true;
      },
      error: (error) => {
        console.error('Error in interview chat:', error);
        this.isLoading.set(false);
        if (error.status === 503 || error.status === 502) {
          this.errorMessage.set('Le service IA est temporairement indisponible. Veuillez réessayer.');
        } else {
          this.errorMessage.set('Erreur lors de l\'envoi du message. Veuillez réessayer.');
        }
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
