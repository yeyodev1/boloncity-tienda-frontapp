export type OpeningHours = { day: string; opensAt: string; closesAt: string; isOpen: boolean }
export type BranchForm = { name: string; city: string; address: string; phone: string; email: string; googleMapsUrl: string; payphoneStoreId: string; cookTimeMinutes: number; isActive: boolean; openingHours: OpeningHours[]; imageFile: File | null; imagePreview: string }

export const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
export function defaultHours(): OpeningHours[] { return weekdays.map((day) => ({ day, opensAt: '07:00', closesAt: '13:00', isOpen: true })) }
