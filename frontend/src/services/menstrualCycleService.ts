import apiClient from './apiClient';

// This is a placeholder. We will define the actual types and API calls later.
export interface MenstrualCycleData {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export const getMenstrualCycleData = async (userId: string): Promise<MenstrualCycleData[]> => {
  const response = await apiClient.get(`/users/${userId}/menstrual-cycle`);
  return response.data as MenstrualCycleData[];
};

export const addMenstrualCycleData = async (data: Omit<MenstrualCycleData, 'id'>): Promise<MenstrualCycleData> => {
  const response = await apiClient.post('/menstrual-cycle', data);
  return response.data as MenstrualCycleData;
};

export const updateMenstrualCycleData = async (id: string, data: Partial<MenstrualCycleData>): Promise<MenstrualCycleData> => {
    const response = await apiClient.put(`/menstrual-cycle/${id}`, data);
    return response.data as MenstrualCycleData;
};

export const deleteMenstrualCycleData = async (id: string): Promise<void> => {
    await apiClient.delete(`/menstrual-cycle/${id}`);
<<<<<<< HEAD
};
=======
}; 
>>>>>>> 6a5e8ced6369211448e3f8988081b82b3fce476b
