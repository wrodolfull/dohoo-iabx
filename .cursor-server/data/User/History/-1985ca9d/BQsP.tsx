import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  User,
  Clock,
  Video,
  VideoOff,
  UserPlus,
  MessageSquare,
  History,
  Headphones,
  Signal,
  Circle,
  Pause,
  Play,
  SkipForward,
  RotateCcw,
  Shield,
  Bell,
  BellOff
} from 'lucide-react';

interface WebPhoneProps {
  agentId: string;
  onStatusChange?: (status: string) => void;
  onCallUpdate?: (callData: any) => void;
}

interface CallState {
  id: string;
  direction: 'incoming' | 'outgoing';
  status: 'ringing' | 'connected' | 'hold' | 'muted' | 'recording';
  callerNumber: string;
  callerName?: string;
  startTime: Date;
  duration: number;
  queue?: string;
  recordingActive: boolean;
}

interface WebRTCConnection {
  socket: WebSocket | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isConnected: boolean;
}

export default function WebPhone({ agentId, onStatusChange, onCallUpdate }: WebPhoneProps) {
  // Estados principais
  const [agentStatus, setAgentStatus] = useState<'Available' | 'Busy' | 'On Break' | 'Offline'>('Offline');
  const [currentCall, setCurrentCall] = useState<CallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallState | null>(null);
  const [webrtc, setWebrtc] = useState<WebRTCConnection>({
    socket: null,
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isConnected: false
  });
  
  // Estados de interface
  const [dialNumber, setDialNumber] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [micVolume, setMicVolume] = useState([80]);
  const [notifications, setNotifications] = useState(true);
  const [autoAnswer, setAutoAnswer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [callHistory, setCallHistory] = useState<CallState[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [networkQuality, setNetworkQuality] = useState(100);
  
  // Refs
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Configuração WebRTC
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.freeswitch.org' },
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  };

  // Inicialização do WebPhone
  useEffect(() => {
    initializeWebPhone();
    requestNotificationPermission();
    
    return () => {
      cleanup();
    };
  }, []);

  // Monitoramento de áudio
  useEffect(() => {
    if (currentCall && webrtc.localStream) {
      startAudioMonitoring();
    }
    
    return () => {
      stopAudioMonitoring();
    };
  }, [currentCall, webrtc.localStream]);

  const initializeWebPhone = async () => {
    try {
      // Conectar ao WebSocket Verto
      const wsUrl = `wss://${window.location.hostname}:8082`;
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket conectado');
        setWebrtc(prev => ({ ...prev, socket, isConnected: true }));
        
        // Autenticar agente
        authenticateAgent(socket);
      };

      socket.onmessage = (event) => {
        handleWebSocketMessage(JSON.parse(event.data));
      };

      socket.onclose = () => {
        console.log('WebSocket desconectado');
        setWebrtc(prev => ({ ...prev, socket: null, isConnected: false }));
        
        // Reconectar após 3 segundos
        setTimeout(initializeWebPhone, 3000);
      };

      socket.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        toast.error('Erro de conexão WebRTC');
      };

    } catch (error) {
      console.error('Erro ao inicializar WebPhone:', error);
      toast.error('Falha ao inicializar WebPhone');
    }
  };

  const authenticateAgent = (socket: WebSocket) => {
    const authMessage = {
      jsonrpc: '2.0',
      method: 'login',
      params: {
        login: agentId,
        passwd: 'agent123', // Em produção, usar autenticação segura
        sessid: generateSessionId()
      },
      id: 1
    };
    
    socket.send(JSON.stringify(authMessage));
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.method) {
      case 'verto.invite':
        handleIncomingCall(message.params);
        break;
      case 'verto.answer':
        handleCallAnswered(message.params);
        break;
      case 'verto.bye':
        handleCallEnded(message.params);
        break;
      case 'verto.media':
        handleMediaUpdate(message.params);
        break;
      case 'callcenter.agent_status':
        handleAgentStatusUpdate(message.params);
        break;
      default:
        console.log('Mensagem WebSocket não tratada:', message);
    }
  };

  const handleCallAnswered = (params: any) => {
    console.log('Call answered:', params);
    if (currentCall) {
      const updatedCall = { ...currentCall, status: 'connected' as const };
      setCurrentCall(updatedCall);
    }
  };

  const handleCallEnded = (params: any) => {
    console.log('Call ended:', params);
    cleanup();
    setCurrentCall(null);
    setIncomingCall(null);
    setAgentStatus('Available');
    if (onStatusChange) onStatusChange('Available');
    if (onCallUpdate) onCallUpdate(null);
  };

  const handleMediaUpdate = (params: any) => {
    console.log('Media update:', params);
    // Handle ICE candidates and media updates
  };

  const handleAgentStatusUpdate = (params: any) => {
    console.log('Agent status update:', params);
    // Handle agent status changes from server
  };

  const handleIncomingCall = (params: any) => {
    const newCall: CallState = {
      id: params.callID,
      direction: 'incoming',
      status: 'ringing',
      callerNumber: params.caller_id_number,
      callerName: params.caller_id_name,
      startTime: new Date(),
      duration: 0,
      queue: params.queue,
      recordingActive: false
    };

    setIncomingCall(newCall);
    
    // Notificação de chamada
    if (notifications) {
      showCallNotification(newCall);
      playRingtone();
    }

    // Auto answer se habilitado
    if (autoAnswer && agentStatus === 'Available') {
      setTimeout(() => answerCall(newCall.id), 2000);
    }
  };

  const answerCall = async (callId: string) => {
    try {
      // Obter mídia do usuário
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoEnabled
      });

      setWebrtc(prev => ({ ...prev, localStream: stream }));

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      if (isVideoEnabled && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Criar peer connection
      const peerConnection = new RTCPeerConnection(rtcConfiguration);
      
      // Adicionar stream local
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Configurar eventos
      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        setWebrtc(prev => ({ ...prev, remoteStream }));
        
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
        }

        if (isVideoEnabled && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && webrtc.socket) {
          const candidateMessage = {
            jsonrpc: '2.0',
            method: 'verto.media',
            params: {
              callID: callId,
              sdp: event.candidate
            }
          };
          webrtc.socket.send(JSON.stringify(candidateMessage));
        }
      };

      setWebrtc(prev => ({ ...prev, peerConnection }));

      // Enviar resposta de answer
      const answerMessage = {
        jsonrpc: '2.0',
        method: 'verto.answer',
        params: {
          callID: callId,
          sessid: generateSessionId()
        }
      };

      if (webrtc.socket) {
        webrtc.socket.send(JSON.stringify(answerMessage));
      }

      // Atualizar estado da chamada
      const call = incomingCall!;
      call.status = 'connected';
      setCurrentCall(call);
      setIncomingCall(null);
      setAgentStatus('Busy');

      if (onStatusChange) onStatusChange('Busy');
      if (onCallUpdate) onCallUpdate(call);

      toast.success('Chamada atendida');

    } catch (error) {
      console.error('Erro ao atender chamada:', error);
      toast.error('Erro ao atender chamada');
    }
  };

  const makeCall = async (number: string) => {
    if (!webrtc.socket || !webrtc.isConnected) {
      toast.error('WebPhone não conectado');
      return;
    }

    try {
      // Obter mídia do usuário
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoEnabled
      });

      setWebrtc(prev => ({ ...prev, localStream: stream }));

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      const callId = generateCallId();
      const newCall: CallState = {
        id: callId,
        direction: 'outgoing',
        status: 'ringing',
        callerNumber: number,
        startTime: new Date(),
        duration: 0,
        recordingActive: false
      };

      setCurrentCall(newCall);
      setAgentStatus('Busy');

      // Enviar invite
      const inviteMessage = {
        jsonrpc: '2.0',
        method: 'verto.invite',
        params: {
          callID: callId,
          caller_id_number: agentId,
          destination_number: number,
          sessid: generateSessionId()
        }
      };

      webrtc.socket.send(JSON.stringify(inviteMessage));

      if (onStatusChange) onStatusChange('Busy');
      if (onCallUpdate) onCallUpdate(newCall);

      toast.success(`Ligando para ${number}...`);

    } catch (error) {
      console.error('Erro ao fazer chamada:', error);
      toast.error('Erro ao fazer chamada');
    }
  };

  const endCall = () => {
    if (currentCall && webrtc.socket) {
      const byeMessage = {
        jsonrpc: '2.0',
        method: 'verto.bye',
        params: {
          callID: currentCall.id,
          cause: 'NORMAL_CLEARING'
        }
      };

      webrtc.socket.send(JSON.stringify(byeMessage));
    }

    // Limpar estado
    cleanup();
    setCurrentCall(null);
    setIncomingCall(null);
    setAgentStatus('Available');

    if (onStatusChange) onStatusChange('Available');
    if (onCallUpdate) onCallUpdate(null);

    toast.success('Chamada encerrada');
  };

  const rejectCall = () => {
    if (incomingCall && webrtc.socket) {
      const rejectMessage = {
        jsonrpc: '2.0',
        method: 'verto.bye',
        params: {
          callID: incomingCall.id,
          cause: 'CALL_REJECTED'
        }
      };

      webrtc.socket.send(JSON.stringify(rejectMessage));
    }

    setIncomingCall(null);
    toast.info('Chamada rejeitada');
  };

  const toggleMute = () => {
    if (webrtc.localStream) {
      const audioTrack = webrtc.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        
        if (currentCall) {
          const updatedCall = { ...currentCall };
          updatedCall.status = !audioTrack.enabled ? 'muted' : 'connected';
          setCurrentCall(updatedCall);
        }
      }
    }
  };

  const toggleVideo = () => {
    if (webrtc.localStream) {
      const videoTrack = webrtc.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const holdCall = () => {
    if (currentCall && webrtc.socket) {
      const holdMessage = {
        jsonrpc: '2.0',
        method: 'verto.modify',
        params: {
          callID: currentCall.id,
          action: 'hold'
        }
      };

      webrtc.socket.send(JSON.stringify(holdMessage));

      const updatedCall = { ...currentCall };
      updatedCall.status = 'hold';
      setCurrentCall(updatedCall);

      toast.info('Chamada em espera');
    }
  };

  const startRecording = () => {
    if (currentCall && webrtc.socket) {
      const recordMessage = {
        jsonrpc: '2.0',
        method: 'verto.modify',
        params: {
          callID: currentCall.id,
          action: 'start_record'
        }
      };

      webrtc.socket.send(JSON.stringify(recordMessage));

      const updatedCall = { ...currentCall };
      updatedCall.recordingActive = true;
      setCurrentCall(updatedCall);

      toast.success('Gravação iniciada');
    }
  };

  const startAudioMonitoring = () => {
    if (!webrtc.localStream) return;

    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(webrtc.localStream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
          setAudioLevel(average);
          
          if (currentCall) {
            requestAnimationFrame(updateAudioLevel);
          }
        }
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Erro ao iniciar monitoramento de áudio:', error);
    }
  };

  const stopAudioMonitoring = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  };

  const showCallNotification = (call: CallState) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Chamada de ${call.callerName || call.callerNumber}`, {
        body: `Fila: ${call.queue || 'Direta'}`,
        icon: '/favicon.ico',
        tag: call.id
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 30000);
    }
  };

  const playRingtone = () => {
    const audio = new Audio('/sounds/ringtone.wav');
    audio.loop = true;
    audio.play().catch(console.error);
    
    // Parar toque quando chamada for atendida ou rejeitada
    const stopRingtone = () => {
      audio.pause();
      audio.currentTime = 0;
    };

    setTimeout(stopRingtone, 30000); // Parar após 30 segundos
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const cleanup = () => {
    if (webrtc.localStream) {
      webrtc.localStream.getTracks().forEach(track => track.stop());
    }
    
    if (webrtc.peerConnection) {
      webrtc.peerConnection.close();
    }

    stopAudioMonitoring();
    
    setWebrtc(prev => ({
      ...prev,
      localStream: null,
      remoteStream: null,
      peerConnection: null
    }));
  };

  const generateSessionId = () => Math.random().toString(36).substr(2, 9);
  const generateCallId = () => Math.random().toString(36).substr(2, 9);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dialpadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            WebPhone
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Signal className="w-4 h-4" />
              <Progress value={networkQuality} className="w-12 h-2" />
            </div>
            <Badge 
              variant={webrtc.isConnected ? 'default' : 'destructive'}
              className="text-xs"
            >
              {webrtc.isConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge 
            variant={agentStatus === 'Available' ? 'default' : 
                    agentStatus === 'Busy' ? 'destructive' : 'secondary'}
          >
            {agentStatus}
          </Badge>
          
          {currentCall && (
            <div className="text-sm text-gray-600">
              {formatDuration(currentCall.duration)}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Chamada Entrada */}
        {incomingCall && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center">
                  <PhoneCall className="w-8 h-8 text-green-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-medium">{incomingCall.callerName || incomingCall.callerNumber}</p>
                  <p className="text-sm text-gray-600">Fila: {incomingCall.queue || 'Direta'}</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => answerCall(incomingCall.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Atender
                  </Button>
                  <Button 
                    onClick={rejectCall}
                    variant="destructive"
                  >
                    <PhoneOff className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chamada Ativa */}
        {currentCall && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-medium">{currentCall.callerName || currentCall.callerNumber}</p>
                  <p className="text-sm text-gray-600">
                    {currentCall.direction === 'incoming' ? 'Entrada' : 'Saída'} • {formatDuration(currentCall.duration)}
                  </p>
                  {currentCall.recordingActive && (
                    <Badge variant="destructive" className="text-xs">
                      <Circle className="w-3 h-3 mr-1 fill-current" />
                      Gravando
                    </Badge>
                  )}
                </div>

                {/* Controles de Chamada */}
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant={isMuted ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={holdCall}
                    disabled={currentCall.status === 'hold'}
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant={currentCall.recordingActive ? "destructive" : "outline"}
                    size="sm"
                    onClick={startRecording}
                  >
                    <Circle className="w-4 h-4 fill-current" />
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={endCall}
                  >
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                </div>

                {/* Nível de Áudio */}
                {audioLevel > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Nível de Áudio</Label>
                    <Progress value={audioLevel} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discador */}
        {!currentCall && !incomingCall && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                placeholder="Digite o número"
                className="flex-1"
              />
              <Button
                onClick={() => makeCall(dialNumber)}
                disabled={!dialNumber || !webrtc.isConnected}
                className="bg-green-600 hover:bg-green-700"
              >
                <Phone className="w-4 h-4" />
              </Button>
            </div>

            {/* Teclado Numérico */}
            <div className="grid grid-cols-3 gap-2">
              {dialpadNumbers.flat().map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  onClick={() => setDialNumber(prev => prev + num)}
                  className="h-12 text-lg"
                >
                  {num}
                </Button>
              ))}
            </div>

            {/* Botões de Ação Rápida */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => makeCall('4000')}
                disabled={!webrtc.isConnected}
              >
                Suporte
              </Button>
              <Button
                variant="outline"
                onClick={() => makeCall('4001')}
                disabled={!webrtc.isConnected}
              >
                Vendas
              </Button>
            </div>
          </div>
        )}

        {/* Controles de Volume */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Volume: {volume[0]}%
            </Label>
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Microfone: {micVolume[0]}%
            </Label>
            <Slider
              value={micVolume}
              onValueChange={setMicVolume}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* Configurações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
              <Label className="text-sm">Notificações</Label>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Áudio/Vídeo Elements (ocultos) */}
        <div className="hidden">
          <audio ref={localAudioRef} autoPlay muted />
          <audio ref={remoteAudioRef} autoPlay />
          <video ref={localVideoRef} autoPlay muted />
          <video ref={remoteVideoRef} autoPlay />
        </div>
      </CardContent>

      {/* Dialog de Configurações */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações do WebPhone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Auto-atender</Label>
              <Switch
                checked={autoAnswer}
                onCheckedChange={setAutoAnswer}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Vídeo</Label>
              <Switch
                checked={isVideoEnabled}
                onCheckedChange={setIsVideoEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Notificações do navegador</Label>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <Button 
              onClick={() => setShowSettings(false)}
              className="w-full"
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 