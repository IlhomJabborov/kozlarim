import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const CAPTURE_INTERVAL_MS = 3000;

function resolveBackendBaseUrl() {
	const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
	if (envUrl) {
		return envUrl.replace(/\/$/, '');
	}

	const manifest2Host = (
		Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }
	).manifest2?.extra?.expoGo?.debuggerHost;
	const hostUri = Constants.expoConfig?.hostUri || manifest2Host || '';
	const host = hostUri.split(':')[0];

	if (host) {
		return `http://${host}:8000`;
	}

	return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
}

export default function App() {
  const cameraRef = useRef<CameraView | null>(null);
  const loopActiveRef = useRef(false);
  const isProcessingRef = useRef(false);

	const [permission, requestPermission] = useCameraPermissions();
	const [isRunning, setIsRunning] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [caption, setCaption] = useState('Caption shu yerda chiqadi...');
	const [error, setError] = useState<string | null>(null);
	const [backendBaseUrl] = useState(resolveBackendBaseUrl);

  const speakCaption = useCallback(async (text: string) => {
    const voices = await Speech.getAvailableVoicesAsync();
    const hasUzbek = voices.some(voice => voice.language?.toLowerCase().startsWith('uz'));
    const language = hasUzbek ? 'uz-UZ' : 'en-US';

    await new Promise<void>((resolve) => {
      Speech.speak(text, {
        language,
        rate: 0.95,
        pitch: 1,
        onDone: resolve,
        onStopped: resolve,
        onError: () => resolve(),
      });
    });
  }, []);

  const sleep = useCallback((ms: number) => new Promise(resolve => setTimeout(resolve, ms)), []);

	const sendImageAndReadCaption = useCallback(async () => {
		if (!cameraRef.current || isProcessingRef.current) {
			return;
		}

		isProcessingRef.current = true;
		setIsLoading(true);
		setError(null);

		try {
			const photo = await cameraRef.current.takePictureAsync({
				quality: 0.7,
				skipProcessing: false,
			});

			if (!photo?.uri) {
				throw new Error('Rasm olinmadi.');
			}

			const formData = new FormData();
			formData.append('image', {
				uri: photo.uri,
				name: 'capture.jpg',
				type: 'image/jpeg',
			} as never);

			const generateEndpoint = `${backendBaseUrl}/generate`;
			const response = await fetch(generateEndpoint, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
				},
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`Server xatosi: ${response.status}`);
			}

			const data = (await response.json()) as { caption?: string };
			const nextCaption = data.caption?.trim() || 'Caption topilmadi.';

			setCaption(nextCaption);
			await speakCaption(nextCaption);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Nomalum xatolik.';
			setError(message);
		} finally {
			setIsLoading(false);
			isProcessingRef.current = false;
		}
	}, [backendBaseUrl, speakCaption]);

  const stopLoop = useCallback(async () => {
    loopActiveRef.current = false;
    setIsRunning(false);
    await Speech.stop();
  }, []);

  const startLoop = useCallback(() => {
    if (!permission?.granted) {
      return;
    }
    if (loopActiveRef.current) {
      return;
    }

    setIsRunning(true);
    setError(null);
    loopActiveRef.current = true;

    void (async () => {
      while (loopActiveRef.current) {
        await sendImageAndReadCaption();
        if (!loopActiveRef.current) {
          break;
        }
        await sleep(CAPTURE_INTERVAL_MS);
      }
    })();
  }, [permission?.granted, sendImageAndReadCaption, sleep]);

  useEffect(() => {
    return () => {
      loopActiveRef.current = false;
      void Speech.stop();
    };
  }, []);

	if (!permission) {
		return (
			<SafeAreaView edges={['top', 'bottom']} style={styles.centered}>
				<ActivityIndicator size='large' color='#0f766e' />
				<Text style={styles.helper}>Kamera ruxsati tekshirilmoqda...</Text>
			</SafeAreaView>
		);
	}

	if (!permission.granted) {
		return (
			<SafeAreaView edges={['top', 'bottom']} style={styles.centered}>
				<Text style={styles.title}>Kamera ruxsati kerak</Text>
				<Text style={styles.helper}>Caption olish uchun kameraga ruxsat bering.</Text>
				<Pressable onPress={requestPermission} style={styles.button}>
					<Text style={styles.buttonText}>Ruxsat sorash</Text>
				</Pressable>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaProvider>
			<SafeAreaView edges={['top', 'bottom']} style={styles.container}>
				<StatusBar style='light' />

				<View style={styles.cameraFrame}>
					<CameraView
						ref={cameraRef}
						style={StyleSheet.absoluteFill}
						facing='back'
						mode='picture'
					/>
				</View>

				<View style={styles.panel}>
					<Text style={styles.panelTitle}>Natija</Text>
					{isLoading ? <ActivityIndicator color='#0f766e' /> : null}
					<Text style={styles.caption}>{caption}</Text>
					{error ? <Text style={styles.error}>{error}</Text> : null}

					<Pressable
						onPress={isRunning ? () => void stopLoop() : startLoop}
						style={[styles.button, isRunning ? styles.stopButton : styles.startButton]}
					>
						<Text style={styles.buttonText}>{isRunning ? 'Stop' : 'Start'}</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0b1020',
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 12,
	},
	centered: {
		flex: 1,
		backgroundColor: '#0b1020',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
		gap: 12,
	},
	cameraFrame: {
		flex: 1,
		borderRadius: 20,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#1f2937',
		backgroundColor: '#111827',
	},
	panel: {
		borderRadius: 16,
		backgroundColor: '#111827',
		padding: 14,
		gap: 10,
		borderWidth: 1,
		borderColor: '#1f2937',
	},
	panelTitle: {
		color: '#f9fafb',
		fontSize: 18,
		fontWeight: '700',
	},
	title: {
		color: '#f9fafb',
		fontSize: 22,
		fontWeight: '700',
	},
	caption: {
		color: '#e5e7eb',
		fontSize: 16,
		lineHeight: 22,
	},
	error: {
		color: '#fca5a5',
		fontSize: 14,
	},
	helper: {
		color: '#93c5fd',
		fontSize: 13,
		textAlign: 'center',
	},
	button: {
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	startButton: {
		backgroundColor: '#0f766e',
	},
	stopButton: {
		backgroundColor: '#be123c',
	},
	buttonText: {
		color: '#f8fafc',
		fontSize: 16,
		fontWeight: '700',
	},
});
