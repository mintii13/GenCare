import { renderHook, act } from '@testing-library/react';
import { useLoading, useSimpleLoading } from './useLoading';

describe('useLoading', () => {
  it('setLoading và setError hoạt động đúng', () => {
    const { result } = renderHook(() => useLoading(['fetch', 'save']));
    act(() => {
      result.current.setLoading('fetch', true, 'Đang fetch');
    });
    expect(result.current.states.fetch.isLoading).toBe(true);
    expect(result.current.states.fetch.loadingMessage).toBe('Đang fetch');
    act(() => {
      result.current.setError('fetch', 'Lỗi fetch');
    });
    expect(result.current.states.fetch.error).toBe('Lỗi fetch');
    act(() => {
      result.current.clearError('fetch');
    });
    expect(result.current.states.fetch.error).toBeNull();
  });

  it('isAnyLoading trả về đúng', () => {
    const { result } = renderHook(() => useLoading(['a', 'b']));
    act(() => {
      result.current.setLoading('a', true);
    });
    expect(result.current.isAnyLoading()).toBe(true);
    act(() => {
      result.current.setLoading('a', false);
    });
    expect(result.current.isAnyLoading()).toBe(false);
  });

  it('executeWithLoading chạy thành công', async () => {
    const { result } = renderHook(() => useLoading(['x']));
    const asyncFn = jest.fn().mockResolvedValue('ok');
    let res;
    await act(async () => {
      res = await result.current.executeWithLoading('x', asyncFn, 'Đang chạy');
    });
    expect(res).toBe('ok');
    expect(result.current.states.x.isLoading).toBe(false);
    expect(result.current.states.x.error).toBeNull();
  });

  it('executeWithLoading bắt lỗi', async () => {
    const { result } = renderHook(() => useLoading(['y']));
    const asyncFn = jest.fn().mockRejectedValue(new Error('Lỗi')); 
    await act(async () => {
      await expect(result.current.executeWithLoading('y', asyncFn)).rejects.toThrow('Lỗi');
    });
    expect(result.current.states.y.error).toBe('Lỗi');
  });
});

describe('useSimpleLoading', () => {
  it('setLoading và setError hoạt động đúng', () => {
    const { result } = renderHook(() => useSimpleLoading());
    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.isLoading).toBe(true);
    act(() => {
      result.current.setError('Lỗi đơn giản');
    });
    expect(result.current.error).toBe('Lỗi đơn giản');
    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });

  it('executeWithLoading chạy thành công', async () => {
    const { result } = renderHook(() => useSimpleLoading());
    const asyncFn = jest.fn().mockResolvedValue('ok');
    let res;
    await act(async () => {
      res = await result.current.executeWithLoading(asyncFn);
    });
    expect(res).toBe('ok');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('executeWithLoading bắt lỗi', async () => {
    const { result } = renderHook(() => useSimpleLoading());
    const asyncFn = jest.fn().mockRejectedValue(new Error('Lỗi đơn giản'));
    await act(async () => {
      await expect(result.current.executeWithLoading(asyncFn)).rejects.toThrow('Lỗi đơn giản');
    });
    expect(result.current.error).toBe('Lỗi đơn giản');
  });
}); 