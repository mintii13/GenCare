import { useState, useCallback } from 'react';

interface ConfirmModalOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'secondary';
}

interface ConfirmModalState extends ConfirmModalOptions {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
}

export const useConfirmModal = () => {
  const [modalState, setModalState] = useState<ConfirmModalState>({
    isOpen: false,
    isLoading: false,
    title: '',
    description: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    confirmVariant: 'default',
    onConfirm: () => {}
  });

  const showConfirm = useCallback((
    options: ConfirmModalOptions,
    onConfirm: () => void | Promise<void>
  ) => {
    setModalState({
      ...options,
      isOpen: true,
      isLoading: false,
      onConfirm: async () => {
        try {
          setModalState(prev => ({ ...prev, isLoading: true }));
          await onConfirm();
          setModalState(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (error) {
          console.error('Confirm action failed:', error);
          setModalState(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false, isLoading: false }));
  }, []);

  return {
    modalState,
    showConfirm,
    hideConfirm
  };
};

export default useConfirmModal; 