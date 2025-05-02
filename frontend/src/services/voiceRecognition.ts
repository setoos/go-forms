import { nanoid } from 'nanoid';

export class VoiceRecognition {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private interimTranscript: string = '';
  private finalTranscript: string = '';
  private confidence: number = 0;
  private language: string = 'en-US';

  constructor(
    private onResult: (text: string, isFinal: boolean) => void,
    private onError: (error: string) => void,
    private onStateChange: (isListening: boolean) => void,
    private onSoundLevel?: (level: number) => void
  ) {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.setupRecognition();
    } else {
      this.onError('Speech recognition is not supported in this browser.');
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 3;

    const resultId = nanoid();

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStateChange(true);
      this.startSoundLevelMonitoring();
    };

    this.recognition.onresult = (event) => {
      this.interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          this.finalTranscript += result[0].transcript;
          this.confidence = result[0].confidence;
          this.onResult(result[0].transcript, true);
        } else {
          this.interimTranscript += result[0].transcript;
          this.onResult(result[0].transcript, false);
        }
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        this.onError('No speech was detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        this.onError('No microphone was found. Ensure that a microphone is installed.');
      } else if (event.error === 'not-allowed') {
        this.onError('Permission to use microphone was denied.');
      } else if (event.error === 'network') {
        this.onError('Network error occurred. Please check your connection.');
      } else {
        this.onError(`Error occurred in recognition: ${event.error}`);
      }
      this.stop();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStateChange(false);
      this.stopSoundLevelMonitoring();
    };
  }

  private async startSoundLevelMonitoring() {
    if (!this.onSoundLevel) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!this.isListening) return;
        
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const normalizedLevel = average / 255;
        
        this.onSoundLevel(normalizedLevel);
        requestAnimationFrame(checkLevel);
      };

      checkLevel();
    } catch (error) {
      console.error('Error monitoring sound level:', error);
    }
  }

  private stopSoundLevelMonitoring() {
    // Clean up any audio context and stream if needed
  }

  public setLanguage(language: string) {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  public toggle() {
    if (!this.recognition) {
      this.onError('Speech recognition is not supported.');
      return;
    }

    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  private start() {
    if (!this.recognition || this.isListening) return;

    try {
      this.finalTranscript = '';
      this.interimTranscript = '';
      this.recognition.start();
    } catch (error) {
      this.onError('Error starting voice recognition.');
    }
  }

  private stop() {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
    } catch (error) {
      this.onError('Error stopping voice recognition.');
    }
  }

  public isActive(): boolean {
    return this.isListening;
  }

  public getConfidence(): number {
    return this.confidence;
  }

  public getCurrentTranscript(): { final: string; interim: string } {
    return {
      final: this.finalTranscript,
      interim: this.interimTranscript
    };
  }
}