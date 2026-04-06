import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Phone, PhoneOff, Mic, Settings, Activity } from 'lucide-react';
import { MockVoiceAgent } from '../services/mock-voice/voice-agent';
import { Slider } from './ui/slider';

export function VoiceTestingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'listening' | 'speaking' | 'ended'>('idle');
  const [transcripts, setTranscripts] = useState<{ role: string, text: string, isFinal: boolean }[]>([]);
  const agentRef = useRef<MockVoiceAgent | null>(null);

  // Settings
  const [latency, setLatency] = useState([500]);
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);

  useEffect(() => {
    // Ensure voices are loaded
    window.speechSynthesis.getVoices();
    return () => {
      if (agentRef.current) agentRef.current.endCall();
    };
  }, []);

  const handleStartCall = (outbound: boolean) => {
    setTranscripts([]);

    agentRef.current = new MockVoiceAgent(
      (text, isFinal) => {
        setTranscripts(prev => {
          const newT = [...prev];
          if (newT.length > 0 && newT[newT.length - 1].role === 'user' && !newT[newT.length - 1].isFinal) {
            newT[newT.length - 1] = { role: 'user', text, isFinal };
          } else {
            newT.push({ role: 'user', text, isFinal });
          }
          return newT;
        });
      },
      (text) => {
        setTranscripts(prev => [...prev, { role: 'agent', text, isFinal: true }]);
      },
      (state) => {
        setCallState(state);
      }
    );

    agentRef.current.latencyMs = latency[0];
    agentRef.current.voiceSpeed = speed[0];
    agentRef.current.voicePitch = pitch[0];

    agentRef.current.startCall(outbound);
  };

  const handleEndCall = () => {
    if (agentRef.current) {
      agentRef.current.endCall();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="gold" className="rounded-full shadow-lg h-12 px-6 flex gap-2" onClick={() => setIsOpen(true)}>
          <Mic className="w-5 h-5" /> Test Voice Agent
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[400px] bg-background border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
      <div className="bg-card border-b border-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gold" />
          <h3 className="font-semibold">Voice Agent Sandbox</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { handleEndCall(); setIsOpen(false); }}>Close</Button>
      </div>

      <div className="p-4 space-y-4 border-b border-border bg-muted/20">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className={`font-medium ${callState === 'connected' || callState === 'listening' || callState === 'speaking' ? 'text-green-500' : 'text-yellow-500'}`}>
            {callState.toUpperCase()}
          </span>
        </div>

        {callState === 'idle' || callState === 'ended' ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => handleStartCall(false)} className="w-full">
              <Phone className="w-4 h-4 mr-2" /> Inbound Call
            </Button>
            <Button variant="gold" onClick={() => handleStartCall(true)} className="w-full">
              <Phone className="w-4 h-4 mr-2" /> Outbound Call
            </Button>
          </div>
        ) : (
          <Button variant="destructive" onClick={handleEndCall} className="w-full">
            <PhoneOff className="w-4 h-4 mr-2" /> End Call
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-[250px] max-h-[300px] overflow-y-auto p-4 space-y-3 bg-background">
        {transcripts.map((t, i) => (
          <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-muted-foreground mb-1 px-1">{t.role === 'user' ? 'You' : 'AI Agent'}</span>
            <div className={`p-3 rounded-lg max-w-[85%] ${t.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} ${!t.isFinal ? 'opacity-50' : ''}`}>
              {t.text}
            </div>
          </div>
        ))}
        {callState === 'listening' && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm p-2">
            <Mic className="w-4 h-4 animate-pulse text-gold" /> Listening...
          </div>
        )}
      </div>

      <div className="p-4 bg-card border-t border-border">
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground flex items-center gap-2 hover:text-foreground">
            <Settings className="w-4 h-4" /> Agent Configuration (Stress Test)
          </summary>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Network Latency ({latency[0]}ms)</span>
              </div>
              <Slider value={latency} onValueChange={setLatency} max={3000} step={100} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Voice Speed ({speed[0]}x)</span>
              </div>
              <Slider value={speed} onValueChange={setSpeed} min={0.5} max={2.0} step={0.1} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Voice Pitch ({pitch[0]})</span>
              </div>
              <Slider value={pitch} onValueChange={setPitch} min={0} max={2} step={0.1} />
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
