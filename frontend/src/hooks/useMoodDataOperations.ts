import { useState, useCallback } from 'react';
import { DailyMoodData, CreateMoodDataRequest, UpdateMoodDataRequest } from '../services/menstrualCycleService';
import useMoodData from './useMoodData';

// Hook for managing mood data form state
export const useMoodDataForm = () => {
  const [formData, setFormData] = useState<DailyMoodData>({
    mood: 'neutral',
    energy: 'medium',
    symptoms: [],
    notes: ''
  });

  const updateFormData = useCallback((field: keyof DailyMoodData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      mood: 'neutral',
      energy: 'medium',
      symptoms: [],
      notes: ''
    });
  }, []);

  const setFormDataFromExisting = useCallback((data: DailyMoodData) => {
    setFormData({
      mood: data.mood || 'neutral',
      energy: data.energy || 'medium',
      symptoms: data.symptoms || [],
      notes: data.notes || ''
    });
  }, []);

  return {
    formData,
    updateFormData,
    resetForm,
    setFormDataFromExisting
  };
};

// Hook for mood data CRUD operations
export const useMoodDataCRUD = (userId?: string) => {
  const { createMoodData, updateMoodData, deleteMoodData, loading, error } = useMoodData(userId);

  const handleCreateMoodData = useCallback(async (date: string, moodData: DailyMoodData): Promise<boolean> => {
    const request: CreateMoodDataRequest = {
      date,
      mood_data: moodData
    };
    return await createMoodData(request);
  }, [createMoodData]);

  const handleUpdateMoodData = useCallback(async (date: string, moodData: Partial<DailyMoodData>): Promise<boolean> => {
    const request: UpdateMoodDataRequest = {
      date,
      mood_data: moodData
    };
    return await updateMoodData(request);
  }, [updateMoodData]);

  const handleDeleteMoodData = useCallback(async (date: string): Promise<boolean> => {
    return await deleteMoodData(date);
  }, [deleteMoodData]);

  return {
    handleCreateMoodData,
    handleUpdateMoodData,
    handleDeleteMoodData,
    loading,
    error
  };
};

// Hook for mood data validation
export const useMoodDataValidation = () => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateMoodData = useCallback((data: DailyMoodData): boolean => {
    const errors: Record<string, string> = {};

    // Validate mood (optional but if provided, check length)
    if (data.mood && data.mood.length > 100) {
      errors.mood = 'Mood không được vượt quá 100 ký tự';
    }

    // Validate energy (optional but if provided, check length)
    if (data.energy && data.energy.length > 100) {
      errors.energy = 'Energy không được vượt quá 100 ký tự';
    }

    // Validate symptoms (optional but if provided, check length)
    if (data.symptoms && data.symptoms.length > 10) {
      errors.symptoms = 'Không được chọn quá 10 triệu chứng';
    }

    // Validate notes (optional but if provided, check length)
    if (data.notes && data.notes.length > 500) {
      errors.notes = 'Ghi chú không được vượt quá 500 ký tự';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  return {
    validationErrors,
    validateMoodData,
    clearValidationErrors
  };
};

// Hook for mood data filtering and search
export const useMoodDataFilter = () => {
  const [filters, setFilters] = useState({
    mood: '',
    energy: '',
    hasSymptoms: false,
    hasNotes: false,
    dateRange: {
      start: '',
      end: ''
    }
  });

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      mood: '',
      energy: '',
      hasSymptoms: false,
      hasNotes: false,
      dateRange: {
        start: '',
        end: ''
      }
    });
  }, []);

  const filterMoodData = useCallback((moodData: Record<string, DailyMoodData>) => {
    return Object.entries(moodData).filter(([date, data]) => {
      // Filter by mood
      if (filters.mood && data.mood && !data.mood.toLowerCase().includes(filters.mood.toLowerCase())) {
        return false;
      }

      // Filter by energy
      if (filters.energy && data.energy && !data.energy.toLowerCase().includes(filters.energy.toLowerCase())) {
        return false;
      }

      // Filter by symptoms
      if (filters.hasSymptoms && (!data.symptoms || data.symptoms.length === 0)) {
        return false;
      }

      // Filter by notes
      if (filters.hasNotes && (!data.notes || data.notes.trim() === '')) {
        return false;
      }

      // Filter by date range
      if (filters.dateRange.start && new Date(date) < new Date(filters.dateRange.start)) {
        return false;
      }

      if (filters.dateRange.end && new Date(date) > new Date(filters.dateRange.end)) {
        return false;
      }

      return true;
    });
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    filterMoodData
  };
};

// Hook for mood data statistics
export const useMoodDataStats = () => {
  const calculateStats = useCallback((moodData: Record<string, DailyMoodData>) => {
    const entries = Object.values(moodData);
    const totalEntries = entries.length;

    if (totalEntries === 0) {
      return {
        totalEntries: 0,
        averageMood: 'Không có dữ liệu',
        mostCommonSymptoms: [],
        moodDistribution: {},
        energyDistribution: {}
      };
    }

    // Calculate mood distribution
    const moodCount: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.mood) {
        moodCount[entry.mood] = (moodCount[entry.mood] || 0) + 1;
      }
    });

    // Calculate energy distribution
    const energyCount: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.energy) {
        energyCount[entry.energy] = (energyCount[entry.energy] || 0) + 1;
      }
    });

    // Calculate most common symptoms
    const symptomCount: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.symptoms) {
        entry.symptoms.forEach(symptom => {
          symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
        });
      }
    });

    const mostCommonSymptoms = Object.entries(symptomCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symptom]) => symptom);

    // Calculate average mood (most frequent)
    const averageMood = Object.entries(moodCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Không có dữ liệu';

    return {
      totalEntries,
      averageMood,
      mostCommonSymptoms,
      moodDistribution: moodCount,
      energyDistribution: energyCount
    };
  }, []);

  return {
    calculateStats
  };
}; 