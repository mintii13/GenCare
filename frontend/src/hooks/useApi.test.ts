import { renderHook, act } from '@testing-library/react';
import { useApi, usePaginatedApi, useAsyncAction } from './useApi';

describe('useApi', () => {
  it('gọi thành công sẽ trả về data', async () => {
    const apiFn = jest.fn().mockResolvedValue({ data: { name: 'test' } });
    const { result } = renderHook(() => useApi(apiFn, { immediate: false }));
    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.data).toEqual({ name: 'test' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('gọi lỗi sẽ trả về error', async () => {
    const apiFn = jest.fn().mockRejectedValue({ message: 'Lỗi API' });
    const { result } = renderHook(() => useApi(apiFn, { immediate: false, showToast: false }));
    await act(async () => {
      await expect(result.current.execute()).rejects.toBeTruthy();
    });
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Lỗi API');
  });
});

describe('useAsyncAction', () => {
  it('thành công sẽ trả về result', async () => {
    const { result } = renderHook(() => useAsyncAction(false));
    const action = jest.fn().mockResolvedValue('ok');
    let res;
    await act(async () => {
      res = await result.current.execute(action, 'Thành công');
    });
    expect(res).toBe('ok');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('lỗi sẽ trả về null và error', async () => {
    const { result } = renderHook(() => useAsyncAction(false));
    const action = jest.fn().mockRejectedValue({ message: 'Lỗi' });
    let res;
    await act(async () => {
      res = await result.current.execute(action, 'Lỗi');
    });
    expect(res).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Lỗi');
  });
});

// usePaginatedApi test cơ bản

describe('usePaginatedApi', () => {
  it('gọi thành công sẽ trả về data', async () => {
    const apiFn = jest.fn().mockResolvedValue({ data: { data: [1, 2], total: 2 } });
    const { result } = renderHook(() => usePaginatedApi(apiFn, [], { limit: 2 }));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.data).toEqual([1, 2]);
    expect(result.current.hasMore).toBe(false);
  });
}); 