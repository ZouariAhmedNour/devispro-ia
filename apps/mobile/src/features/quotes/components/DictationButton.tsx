import { useState } from "react";
import { Alert } from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/useAuth";
import { toMessage } from "@/lib/errors";
import { transcribeRecording } from "../ai";

export function DictationButton({ onText }: { onText: (text: string) => void }) {
  const { profile } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY); // m4a (AAC)
  const recorderState = useAudioRecorderState(recorder);
  const [transcribing, setTranscribing] = useState(false);

  async function start() {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Micro refusé", "Autorise le micro dans les réglages du téléphone pour dicter.");
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stop() {
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri || !profile) return;

    setTranscribing(true);
    try {
      const text = await transcribeRecording(uri, profile.companyId);
      if (text) onText(text);
      else Alert.alert("Rien compris", "Réessaie en parlant plus près du micro.");
    } catch (err) {
      Alert.alert("Transcription impossible", toMessage(err));
    } finally {
      setTranscribing(false);
    }
  }

  if (recorderState.isRecording) {
    const seconds = Math.floor(recorderState.durationMillis / 1000);
    return <Button title={`⏹ Arrêter (${seconds} s)`} variant="danger" onPress={stop} style={{ flex: 1 }} />;
  }

  return (
    <Button
      title="🎤 Dicter"
      variant="outline"
      loading={transcribing}
      disabled={!profile}
      onPress={start}
      style={{ flex: 1 }}
    />
  );
}