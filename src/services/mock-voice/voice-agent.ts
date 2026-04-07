import { aiProvider } from '../ai-provider';

// This simulates the voice service using Browser APIs for local testing of "voice quality" and "latency"
export class MockVoiceAgent {
  private synth: SpeechSynthesis;
  private recognition: unknown;
  private isListening: boolean = false;
  private onTranscriptUpdate: (text: string, isFinal: boolean) => void;
  private onAgentSpeak: (text: string) => void;
  private onCallStateChange: (state: 'idle' | 'calling' | 'connected' | 'listening' | 'speaking' | 'ended') => void;
  private currentCallState: 'idle' | 'calling' | 'connected' | 'listening' | 'speaking' | 'ended' = 'idle';
  private conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];

  // Settings to simulate
  public latencyMs: number = 500;
  public voiceSpeed: number = 1.0;
  public voicePitch: number = 1.0;

  constructor(
    onTranscriptUpdate: (text: string, isFinal: boolean) => void,
    onAgentSpeak: (text: string) => void,
    onCallStateChange: (state: 'idle' | 'calling' | 'connected' | 'listening' | 'speaking' | 'ended') => void
  ) {
    this.synth = window.speechSynthesis;
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onAgentSpeak = onAgentSpeak;
    this.onCallStateChange = onCallStateChange;

    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new (SpeechRecognition as new () => unknown)();
      (this.recognition as { continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onend: unknown; onerror: unknown; start: () => void; stop: () => void; }).continuous = false; // Stop after each phrase to respond
      (this.recognition as { continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onend: unknown; onerror: unknown; start: () => void; stop: () => void; }).interimResults = true;
      (this.recognition as { continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onend: unknown; onerror: unknown; start: () => void; stop: () => void; }).lang = 'en-US';

      (this.recognition as { continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onend: unknown; onerror: unknown; start: () => void; stop: () => void; }).onresult = (event: { resultIndex: number; results: { isFinal: boolean; [index: number]: { transcript: string } }[]; error?: string }) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          this.onTranscriptUpdate(finalTranscript, true);
          this.handleUserSpeech(finalTranscript);
        } else if (interimTranscript) {
          this.onTranscriptUpdate(interimTranscript, false);
        }
      };

      (this.recognition as { continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onend: unknown; onerror: unknown; start: () => void; stop: () => void; }).onend = () => {
        if (this.currentCallState === 'listening') {
          // Restart listening if we haven't switched to speaking yet
          // Actually, we usually want to wait for AI response before listening again
          // Let's handle this in `handleUserSpeech`
        }
      };

      (this.recognition as { continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onend: unknown; onerror: unknown; start: () => void; stop: () => void; }).onerror = (event: { resultIndex: number; results: { isFinal: boolean; [index: number]: { transcript: string } }[]; error?: string }) => {
        console.error('Speech recognition error', (event as { error: string }).error);
        if ((event as { error: string }).error === 'not-allowed') {
          this.endCall();
        }
      };
    } else {
      console.error('Speech recognition not supported in this browser.');
    }
  }

  private setCallState(state: 'idle' | 'calling' | 'connected' | 'listening' | 'speaking' | 'ended') {
    this.currentCallState = state;
    this.onCallStateChange(state);
  }

  public async startCall(outbound: boolean = false) {
    this.setCallState('calling');
    this.conversationHistory = [];

    // Simulate ring/connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.setCallState('connected');

    if (outbound) {
      this.setCallState('speaking');
      const greeting = "Hi there, this is Alex from Door Step Auto. I'm following up on your recent inquiry. How can I help you today?";
      await this.speak(greeting);
      this.conversationHistory.push({ role: 'assistant', content: greeting });
      this.startListening();
    } else {
      this.setCallState('speaking');
      const greeting = "Thank you for calling Door Step Auto. My name is Alex. How can I assist you?";
      await this.speak(greeting);
      this.conversationHistory.push({ role: 'assistant', content: greeting });
      this.startListening();
    }
  }

  public endCall() {
    this.setCallState('ended');
    this.synth.cancel();
    if (this.recognition && this.isListening) {
      (this.recognition as { continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onend: unknown; onerror: unknown; start: () => void; stop: () => void; }).stop();
      this.isListening = false;
    }
    setTimeout(() => this.setCallState('idle'), 2000);
  }

  private startListening() {
    if (this.currentCallState === 'ended' || !this.recognition) return;
    this.setCallState('listening');
    this.isListening = true;
    try {
      (this.recognition as { continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onend: unknown; onerror: unknown; start: () => void; stop: () => void; }).start();
    } catch (e) {
      // already started
    }
  }

  private stopListening() {
    if (this.recognition && this.isListening) {
      (this.recognition as { continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onend: unknown; onerror: unknown; start: () => void; stop: () => void; }).stop();
      this.isListening = false;
    }
  }

  private async handleUserSpeech(text: string) {
    this.stopListening();
    this.setCallState('speaking'); // transitioning to speaking soon
    this.conversationHistory.push({ role: 'user', content: text });

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, this.latencyMs));

    try {
      const response = await aiProvider.complete({
        messages: [
          { role: 'system', content: "You are an expert automotive sales AI agent. Keep responses short and conversational, suitable for voice." },
          ...this.conversationHistory,
        ],
      });

      this.conversationHistory.push({ role: 'assistant', content: response.message });
      await this.speak(response.message);

      if (this.currentCallState !== 'ended') {
        this.startListening();
      }
    } catch (error) {
      console.error("AI error", error);
      await this.speak("I'm sorry, I'm having a little trouble connecting. Could you repeat that?");
      if (this.currentCallState !== 'ended') {
        this.startListening();
      }
    }
  }

  private speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentCallState === 'ended') {
        resolve();
        return;
      }

      this.onAgentSpeak(text);

      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a good female/male en-US voice
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'))
                          || voices.find(v => v.lang === 'en-US');
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.rate = this.voiceSpeed;
      utterance.pitch = this.voicePitch;

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (e) => {
        console.error('Speech synthesis error', e);
        resolve();
      };

      this.synth.speak(utterance);
    });
  }
}
