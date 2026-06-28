import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AiSuggestionsComponent } from './ai-suggestions.component';

describe('AiSuggestionsComponent', () => {
  let component: AiSuggestionsComponent;
  let fixture: ComponentFixture<AiSuggestionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiSuggestionsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiSuggestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a keyword when pressing Enter', () => {
    component['currentInput'].set('Java');
    component.addKeyword(new Event('keydown'));
    expect(component['keywords']()).toContain('Java');
  });

  it('should not add duplicate keywords', () => {
    component['keywords'].set(['Java']);
    component['currentInput'].set('Java');
    component.addKeyword(new Event('keydown'));
    expect(component['keywords']().length).toBe(1);
  });

  it('should not add empty keyword', () => {
    component['currentInput'].set('   ');
    component.addKeyword(new Event('keydown'));
    expect(component['keywords']().length).toBe(0);
  });

  it('should remove a keyword by index', () => {
    component['keywords'].set(['Java', 'Spring', 'Docker']);
    component.removeKeyword(1);
    expect(component['keywords']()).toEqual(['Java', 'Docker']);
  });

  it('should return correct score class', () => {
    expect(component.getScoreClass(80)).toBe('score-high');
    expect(component.getScoreClass(50)).toBe('score-medium');
    expect(component.getScoreClass(20)).toBe('score-low');
  });

  it('should disable button when no keywords', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-suggest');
    expect(button.disabled).toBeTrue();
  });
});
