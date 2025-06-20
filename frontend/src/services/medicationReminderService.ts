export interface MedicationReminder {
    id: string
    userId: string
    medicationName: string
    time: string
    frequency: string
    startDate: string
  }
  
  // This would be replaced with actual API calls
  export const medicationReminderService = {
    async createReminder(reminder: Omit<MedicationReminder, "id">): Promise<MedicationReminder> {
      // Simulate API call
      return {
        ...reminder,
        id: Date.now().toString(),
      }
    },
  
    async updateReminder(id: string, reminder: Partial<MedicationReminder>): Promise<MedicationReminder> {
      // Simulate API call
      return { ...reminder, id } as MedicationReminder
    },
  
    async deleteReminder(id: string): Promise<void> {
      // Simulate API call
      console.log(`Deleting reminder ${id}`)
    },
  
    async getUserReminders(userId: string): Promise<MedicationReminder[]> {
      // Simulate API call
      return []
    },
  }
  