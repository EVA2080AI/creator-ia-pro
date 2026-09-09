import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// Mock del cliente better-auth — la sesión real vive en el servidor.
const { signOutMock, useSessionMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: { signOut: signOutMock },
  useSession: () => useSessionMock(),
}));

// useAuth usa useNavigate → necesita un Router en el árbol.
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue(undefined);
  });

  it('should initialize with loading state', () => {
    useSessionMock.mockReturnValue({ data: null, isPending: true });
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should expose the user once the session resolves', () => {
    const user = { id: 'u1', email: 'test@creator-ia.com' };
    useSessionMock.mockReturnValue({ data: { user }, isPending: false });
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(user);
  });

  it('should handle sign out', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'u1' } },
      isPending: false,
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(signOutMock).toHaveBeenCalledTimes(1);
  });
});