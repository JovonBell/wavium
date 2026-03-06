/**
 * WAVIUM - AI Consent Modal
 * Required by Apple Guideline 5.1.2(i) (Nov 2025)
 * Must be shown before any AI/TTS processing occurs
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AIConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentModal({ visible, onAccept, onDecline }: AIConsentModalProps) {
  const handleAccept = async () => {
    await AsyncStorage.setItem('wavium-ai-consent', 'true');
    onAccept();
  };

  const handleDecline = () => {
    Alert.alert(
      'AI Consent Required',
      'Wavium uses AI to generate personalized affirmations. The app cannot function without processing your data through AI services. Please accept to continue.',
      [{ text: 'OK' }]
    );
    onDecline();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>AI-Powered Content</Text>

            <Text style={styles.body}>
              Wavium uses AI technology to create personalized content for you. Before you begin, please review how your data is processed:
            </Text>

            <View style={styles.bulletGroup}>
              <Text style={styles.bullet}>
                {'\u2022'}  Your intentions are processed by <Text style={styles.bold}>Groq AI (Llama language model)</Text> to generate personalized affirmations.
              </Text>
              <Text style={styles.bullet}>
                {'\u2022'}  <Text style={styles.bold}>Microsoft Edge Text-to-Speech</Text> converts your affirmations into whispered audio.
              </Text>
              <Text style={styles.bullet}>
                {'\u2022'}  Your data is sent to these <Text style={styles.bold}>third-party services</Text> for processing.
              </Text>
              <Text style={styles.bullet}>
                {'\u2022'}  Generated content is for <Text style={styles.bold}>personal wellness only</Text> and is not medical advice.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => Linking.openURL('https://wavium-production.up.railway.app/privacy').catch(() => {})}
            >
              <Text style={styles.link}>View our Privacy Policy</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>I Understand & Agree</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
              activeOpacity={0.7}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#cccccc',
    marginBottom: 16,
  },
  bulletGroup: {
    marginBottom: 16,
    gap: 10,
  },
  bullet: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#cccccc',
    paddingLeft: 4,
  },
  bold: {
    fontFamily: 'Raleway_500Medium',
    color: '#e0e0e0',
  },
  link: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 14,
    color: '#6c5ce7',
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 8,
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  declineButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  declineButtonText: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 14,
    color: '#888888',
  },
});
