// Common types used across the application

export interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  isactive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  preferences?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface WorkingHours {
  monday: { start: string; end: string; isWorking: boolean }
  tuesday: { start: string; end: string; isWorking: boolean }
  wednesday: { start: string; end: string; isWorking: boolean }
  thursday: { start: string; end: string; isWorking: boolean }
  friday: { start: string; end: string; isWorking: boolean }
  saturday: { start: string; end: string; isWorking: boolean }
  sunday: { start: string; end: string; isWorking: boolean }
}

export interface Employee {
  id: string
  name: string
  email?: string
  phone?: string
  specialties: string[]
  workingHours: WorkingHours
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface AvailableEmployee extends Employee {
  availableSlots: string[]
}

export interface AppointmentService {
  id: string
  serviceId: string
  service: Service
}

export interface Appointment {
  id: string
  date: Date
  time: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  customerId: string
  customer: Customer
  employeeId: string
  employee: Employee
  services: AppointmentService[]
  totalPrice: number
  createdAt?: Date
  updatedAt?: Date
}

export interface Statistics {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  totalRevenue: number
  averageAppointmentValue: number
  topServices: Array<{
    service: Service
    count: number
    revenue: number
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
    appointments: number
  }>
}

// Component Props Types
export interface EmployeeManagementProps {
  onEmployeeCreated?: () => void
  refreshTrigger?: number
}

export interface AppointmentsCalendarProps {
  onAppointmentCreated?: () => void
  refreshTrigger?: number
}

export interface SimpleCalendarProps {
  onAppointmentCreated?: () => void
  refreshTrigger?: number
}

export interface StatisticsDashboardProps {
  appointments: Appointment[]
}

export interface CustomerManagementProps {
  refreshTrigger?: number
  onCustomerUpdated?: () => void
}

export interface AppointmentBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  selectedTime?: string
  onAppointmentCreated?: () => void
}