# Testing Patterns

**Analysis Date:** 2026-02-02

## Test Framework

**Current State:**
- No test framework configured in project
- No test files found in `src/` directory
- No jest.config.js, vitest.config.js, or equivalent test configuration

**Recommendation:**
- Testing infrastructure should be added before production release
- React Native projects typically use Jest with @testing-library/react-native
- Backend (Python/FastAPI) should use pytest with FastAPI test client

## Test File Organization

**Location:**
- Frontend tests should be co-located: `src/components/ui/__tests__/` or `src/api/__tests__/`
- Backend tests should be in `backend/tests/` directory (not yet created)

**Naming:**
- Frontend: `[ComponentName].test.tsx` or `[ComponentName].spec.tsx`
- Backend: `test_[module_name].py`

**Structure:**
```
src/
├── api/
│   ├── __tests__/
│   │   ├── client.test.ts
│   │   ├── hooks.test.ts
│   │   └── __mocks__/
│   │       └── client.ts
├── components/
│   ├── ui/
│   │   ├── __tests__/
│   │   │   └── HapticButton.test.tsx
├── stores/
│   ├── __tests__/
│   │   └── useMindiStore.test.ts
└── systems/
    ├── __tests__/
        └── AudioSystem.test.ts
```

## What Should Be Tested

### Frontend (Priority Order)

**1. API Client & Hooks (High Priority)**
- Location: `src/api/client.ts`, `src/api/hooks.ts`
- Test request/response handling in `WaviumApiClient.request<T>()`
- Test error handling for network failures (timeouts, AbortError)
- Test API methods: `healthCheck()`, `processIntention()`, `generateAffirmations()`, etc.
- Test hook loading/error/data states: `useApi<T>()`, `useGeneration()`, `useProcessIntention()`
- Mock fetch/WebSocket for isolation

**2. Store State Management (High Priority)**
- Location: `src/stores/useMindiStore.ts`
- Test store initialization
- Test creation flow: `setIntention()`, `setAffirmations()`, `setSelectedTrack()`
- Test subliminal library: `saveSubliminal()`, `deleteSubliminal()`, `getSubliminal()`
- Test persistence via AsyncStorage
- Test `resetOnboarding()` functionality

**3. Audio System (Medium Priority)**
- Location: `src/systems/AudioSystem.ts`
- Test audio loading: `load()`, `loadLocal()` with success/failure
- Test playback controls: `play()`, `pause()`, `stop()`, `seek()`
- Test status callback mechanism
- Test level simulation for visualization
- Mock expo-av module

**4. Haptic System (Medium Priority)**
- Location: `src/systems/HapticSystem.ts`
- Test haptic trigger methods
- Mock expo-haptics

**5. Components (Medium Priority)**
- Location: `src/components/`
- Test component rendering with different props
- Test animation triggers (HapticButton, BreathingCircle)
- Test user interactions (button presses, phase changes)
- Test conditional rendering based on props

**6. Theme System (Low Priority)**
- Location: `src/theme/colors.ts`, `src/theme/spacing.ts`
- Test theme selection by time of day
- Test color values are valid hex codes

### Backend (Python/FastAPI) (High Priority)

**1. API Endpoints**
- Test `GET /health` returns healthy status
- Test `POST /api/generate-affirmations` with valid/invalid input
- Test `POST /api/generate-audio` with valid/invalid input
- Test `GET /api/voices` returns voice list
- Test error handling and HTTP status codes (400, 500)

**2. Services**
- Test `generate_affirmations()` in `groq_service.py`
  - Mock Groq API client
  - Test response parsing
  - Test numbering/bullet removal
- Test `generate_audio()` in `tts_service.py`
  - Mock edge_tts
  - Test file creation and path handling
  - Test voice selection

**3. Request Validation**
- Test Pydantic models validate input correctly
- Test empty/invalid intention strings are rejected
- Test empty affirmations list is rejected

## Mocking Strategy

**Frontend:**

Mock fetch requests in API client tests:
```typescript
// Mock fetch globally
global.fetch = jest.fn((url: string) => {
  if (url.includes('/health')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 'healthy' })
    });
  }
  return Promise.reject(new Error('Unknown endpoint'));
});
```

Mock Zustand stores in component tests:
```typescript
jest.mock('../../stores/useThemeStore', () => ({
  useThemeStore: () => ({
    colors: { /* mock colors */ }
  })
}));
```

Mock expo modules:
```typescript
jest.mock('expo-av', () => ({
  Audio: {
    Sound: { createAsync: jest.fn() },
    setAudioModeAsync: jest.fn()
  }
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn()
}));
```

Mock WebSocket:
```typescript
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  close: jest.fn()
}));
```

**Backend (Python):**

Use FastAPI test client:
```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

Mock Groq client:
```python
from unittest.mock import patch, AsyncMock

@patch('services.groq_service.client')
async def test_generate_affirmations(mock_groq):
    mock_groq.chat.completions.create.return_value = AsyncMock(
        choices=[AsyncMock(message=AsyncMock(content="I am strong\nI am capable\n"))]
    )
    result = await generate_affirmations("be confident")
    assert len(result) > 0
```

Mock edge-tts:
```python
from unittest.mock import patch, AsyncMock

@patch('services.tts_service.edge_tts.Communicate')
async def test_generate_audio(mock_tts):
    mock_instance = AsyncMock()
    mock_tts.return_value = mock_instance
    result = await generate_audio(["I am strong"], "jenny")
    assert result.endswith('.mp3')
```

**What to Mock:**
- External API calls (Groq, edge-tts, Microsoft TTS)
- File I/O operations
- Network requests (fetch, WebSocket)
- Platform-specific APIs (expo modules)
- Async storage
- Timer functions (setTimeout) - use jest fake timers

**What NOT to Mock:**
- Zustand store implementation (test actual store behavior)
- Theme selection logic
- Helper functions
- Type validation (Pydantic, TypeScript)
- Business logic in services (test with mocked external calls)

## Fixtures and Factories

**Frontend Test Data:**

Create factory functions for common test objects:

```typescript
// src/api/__tests__/__fixtures__/factories.ts

export const createMockApiResponse = <T>(data: T, error = null): ApiResponse<T> => ({
  data,
  error,
  status: error ? 400 : 200
});

export const createMockAffirmations = (): string[] => [
  "I am strong and capable",
  "I attract positive energy",
  "I am grateful for this moment"
];

export const createMockMindiState = (overrides = {}) => ({
  glow_level: 1,
  evolution_stage: 0,
  total_xp: 0,
  current_streak: 0,
  ...overrides
});

export const createMockSubliminal = (overrides = {}) => ({
  id: '123',
  title: 'Test Subliminal',
  intention: 'Be confident',
  affirmations: createMockAffirmations(),
  track: 'ocean-waves' as const,
  audioUrl: 'http://test.com/audio.mp3',
  createdAt: new Date().toISOString(),
  ...overrides
});
```

**Location:**
- `src/api/__tests__/__fixtures__/factories.ts`
- `src/__tests__/__fixtures__/mocks.ts` (shared)

**Backend Test Data:**

```python
# backend/tests/fixtures.py

def create_mock_affirmations():
    return [
        "I am strong and capable",
        "I attract positive energy",
        "I am grateful for this moment"
    ]

def create_intention():
    return "improve my focus and concentration"
```

## Coverage

**Requirements:** Not enforced (no coverage config)

**Recommended targets:**
- API client: 90%+ (critical path)
- API hooks: 85%+ (state management)
- Stores: 95%+ (single source of truth)
- Services: 80%+ (with external API mocking)
- Components: 60%+ (UI changes frequently)
- Theme/config: 50%+ (mostly static values)

**View Coverage:**
```bash
# Frontend (once Jest is configured)
npm test -- --coverage

# Backend
pytest --cov=services --cov=main --cov-report=html
```

## Test Examples

### Frontend: API Hook Test

```typescript
// src/api/__tests__/hooks.test.ts

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useProcessIntention } from '../hooks';
import * as apiClient from '../client';

jest.mock('../client');

describe('useProcessIntention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start with loading false', () => {
    const { result } = renderHook(() => useProcessIntention());
    expect(result.current.loading).toBe(false);
  });

  it('should process intention and set result', async () => {
    const mockResponse = {
      affirmations: ['I am strong', 'I am capable'],
      title: 'Confidence',
      category: 'personal-growth'
    };

    jest.spyOn(apiClient, 'api').mockResolvedValueOnce({
      data: mockResponse,
      error: null,
      status: 200
    });

    const { result } = renderHook(() => useProcessIntention());

    await act(async () => {
      await result.current.process('Be confident');
    });

    expect(result.current.result).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    jest.spyOn(apiClient, 'api').mockResolvedValueOnce({
      data: null,
      error: 'Network error',
      status: 0
    });

    const { result } = renderHook(() => useProcessIntention());

    await act(async () => {
      await result.current.process('Be confident');
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.result).toBeNull();
  });
});
```

### Frontend: Component Test

```typescript
// src/components/ui/__tests__/HapticButton.test.tsx

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HapticButton from '../HapticButton';
import * as Haptics from 'expo-haptics';

jest.mock('expo-haptics');
jest.mock('../../../stores/useThemeStore', () => ({
  useThemeStore: () => ({
    colors: {
      primary: '#6366f1',
      textMuted: '#505080',
      error: '#f87171'
    }
  })
}));

describe('HapticButton', () => {
  it('should render with text', () => {
    const { getByText } = render(
      <HapticButton onPress={jest.fn()}>Press me</HapticButton>
    );
    expect(getByText('Press me')).toBeTruthy();
  });

  it('should trigger haptic feedback on press', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <HapticButton onPress={onPress} haptic="medium">
        Press me
      </HapticButton>
    );

    fireEvent.press(getByRole('button'));

    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Medium
    );
    expect(onPress).toHaveBeenCalled();
  });

  it('should not trigger when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <HapticButton onPress={onPress} disabled>
        Press me
      </HapticButton>
    );

    fireEvent.press(getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### Backend: FastAPI Endpoint Test

```python
# backend/tests/test_main.py

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_generate_affirmations_success():
    response = client.post(
        "/api/generate-affirmations",
        json={"intention": "be more confident"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "affirmations" in data
    assert "intention" in data
    assert len(data["affirmations"]) > 0

def test_generate_affirmations_empty_intention():
    response = client.post(
        "/api/generate-affirmations",
        json={"intention": ""}
    )
    assert response.status_code == 400
    assert "Intention cannot be empty" in response.json()["detail"]
```

### Backend: Service Test

```python
# backend/tests/test_groq_service.py

import pytest
from unittest.mock import patch, AsyncMock
from services.groq_service import generate_affirmations

@pytest.mark.asyncio
@patch('services.groq_service.client')
async def test_generate_affirmations_removes_numbering(mock_groq):
    mock_response = AsyncMock()
    mock_response.choices = [AsyncMock()]
    mock_response.choices[0].message.content = "1. I am strong\n2. I am capable\n3. I am worthy"

    mock_groq.chat.completions.create.return_value = mock_response

    result = await generate_affirmations("be confident")

    assert len(result) == 3
    assert result[0] == "I am strong"
    assert not any(r.startswith(('1.', '2.', '3.')) for r in result)
```

---

*Testing analysis: 2026-02-02*

**Note:** Current project has no test infrastructure. These patterns should be established before production deployment. Start with API client/hooks tests (highest priority), then store tests, then component tests.
