export class TextToSpeech {
  private synthesis: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isPlaying: boolean = false;
  private currentText: string = '';

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.setupVoice();
  }

  private setupVoice() {
    // Wait for voices to be loaded
    if (this.synthesis.getVoices().length === 0) {
      this.synthesis.addEventListener('voiceschanged', () => {
        const voices = this.synthesis.getVoices();
        // Prefer an English voice
        this.voice = voices.find(voice => voice.lang.startsWith('en-')) || voices[0];
      });
    } else {
      const voices = this.synthesis.getVoices();
      this.voice = voices.find(voice => voice.lang.startsWith('en-')) || voices[0];
    }
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.synthesis) return;

    // If the same text is already being spoken, don't interrupt it
    if (this.isPlaying && this.currentText === text) {
      return;
    }

    // Stop any current speech before starting new one
    this.stop();

    this.currentText = text;
    this.utterance = new SpeechSynthesisUtterance(text);
    
    if (this.voice) {
      this.utterance.voice = this.voice;
    }
    
    this.utterance.rate = 1;
    this.utterance.pitch = 1;

    this.utterance.onend = () => {
      this.isPlaying = false;
      this.currentText = '';
      if (onEnd) onEnd();
    };

    this.utterance.onerror = (event) => {
      // Only log as error if it's not an interruption
      if ((event as any).error !== 'interrupted') {
        console.error('TTS Error:', event);
      }
      this.isPlaying = false;
      this.currentText = '';
      if (onEnd) onEnd();
    };

    try {
      this.synthesis.speak(this.utterance);
      this.isPlaying = true;
    } catch (error) {
      console.error('Failed to start speech:', error);
      this.isPlaying = false;
      this.currentText = '';
      if (onEnd) onEnd();
    }
  }

  public stop() {
    if (this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch (error) {
        console.error('Failed to stop speech:', error);
      }
      this.isPlaying = false;
      this.currentText = '';
    }
  }

  public isActive(): boolean {
    return this.isPlaying;
  }

  public getCurrentText(): string {
    return this.currentText;
  }
}