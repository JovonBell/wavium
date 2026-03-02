/**
 * WAVIUM - Error Boundary
 * Catches React render crashes and shows a recovery screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app encountered an unexpected error. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
            accessibilityLabel="Try again"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
