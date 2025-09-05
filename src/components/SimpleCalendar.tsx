"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, DollarSign, Users, Filter, ChevronLeft, ChevronRight, Plus, Edit, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import AppointmentBookingDialog from "@/components/AppointmentBookingDialog"

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
}

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
}

interface Employee {
  id: string
  name: string
  email?: string
  phone?: string
  specialties?: string
  isActive: boolean
}

interface AppointmentService {
  id: string
  service: Service
}

interface Appointment {
  id: string
  date: string
  status: string
  notes?: string
  totalDuration: number
  totalPrice: number
  customer: Customer
  employee?: Employee
  services: AppointmentService[]
}

interface SimpleCalendarProps {
  onAppointmentCreated?: () => void
  refreshTrigger?: number
}

export default function SimpleCalendar({ onAppointmentCreated, refreshTrigger }: SimpleCalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [refreshTrigger])

  useEffect(() => {
    filterAppointments()
  }, [appointments, statusFilter, searchTerm, currentDate, selectedDay])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = appointments

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.customer.phone.includes(searchTerm) ||
        app.services.some(s => s.service.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Date filter - show appointments for the selected day only
    if (selectedDay) {
      filtered = filtered.filter(app => {
        const appDate = new Date(app.date)
        return appDate.toDateString() === selectedDay.toDateString()
      })
    } else {
      // If no day is selected, show today's appointments
      const today = new Date()
      filtered = filtered.filter(app => {
        const appDate = new Date(app.date)
        return appDate.toDateString() === today.toDateString()
      })
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    setFilteredAppointments(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'NO_SHOW':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Προγραμματισμένο'
      case 'COMPLETED':
        return 'Ολοκληρωμένο'
      case 'CANCELLED':
        return 'Ακυρωμένο'
      case 'NO_SHOW':
        return 'Δεν ήρθε'
      default:
        return status
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('el-GR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEditAppointment = (appointment: Appointment) => {
    console.log('Edit button clicked for appointment:', appointment.id)
    setEditingAppointment(appointment)
    setSelectedCustomer(appointment.customer)
    setShowEditDialog(true)
  }

  const handleDeleteAppointment = (appointmentId: string) => {
    console.log('Delete button clicked for appointment:', appointmentId)
    setAppointmentToDelete(appointmentId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return
    
    try {
      const response = await fetch(`/api/appointments/${appointmentToDelete}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Refresh appointments list
        fetchAppointments()
        if (onAppointmentCreated) {
          onAppointmentCreated()
        }
      } else {
        alert('Σφάλμα κατά τη διαγραφή του ραντεβού')
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      alert('Σφάλμα κατά τη διαγραφή του ραντεβού')
    } finally {
      setAppointmentToDelete(null)
    }
  }

  const handleAppointmentUpdated = () => {
    fetchAppointments()
    onAppointmentCreated?.()
  }

  // Οργάνωση ραντεβού ανά ώρα
  const getAppointmentsByHour = () => {
    const hourGroups: { [key: string]: Appointment[] } = {}
    
    filteredAppointments.forEach(appointment => {
      const hour = new Date(appointment.date).getHours()
      const hourKey = `${hour.toString().padStart(2, '0')}:00`
      
      if (!hourGroups[hourKey]) {
        hourGroups[hourKey] = []
      }
      hourGroups[hourKey].push(appointment)
    })
    
    // Ταξινόμηση ανά ώρα και μετά ανά λεπτό
    Object.keys(hourGroups).forEach(hour => {
      hourGroups[hour].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    })
    
    // Επιστροφή ταξινομημένων ωρών
    return Object.keys(hourGroups)
      .sort()
      .map(hour => ({
        hour,
        appointments: hourGroups[hour]
      }))
  }

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetHour: string) => {
    e.preventDefault()
    
    if (!draggedAppointment) return
    
    const [hours, minutes] = targetHour.split(':')
    const newDate = new Date(draggedAppointment.date)
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    try {
      const response = await fetch(`/api/appointments/${draggedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: newDate.toISOString(),
        }),
      })
      
      if (response.ok) {
        // Ανανέωση των ραντεβού
        fetchAppointments()
      } else {
        console.error('Σφάλμα κατά την ενημέρωση του ραντεβού')
      }
    } catch (error) {
      console.error('Σφάλμα:', error)
    } finally {
      setDraggedAppointment(null)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    // Clear selected day when navigating months
    setSelectedDay(null)
  }

  const handleDayClick = (date: Date) => {
    setSelectedDay(date)
  }

  const handleAppointmentCreated = () => {
    fetchAppointments()
    onAppointmentCreated?.()
  }

  const getAppointmentsByDate = () => {
    const appointmentsByDate: { [key: string]: Appointment[] } = {}
    
    // Use all appointments for the calendar, not filtered ones
    appointments.forEach(appointment => {
      const date = new Date(appointment.date).toDateString()
      if (!appointmentsByDate[date]) {
        appointmentsByDate[date] = []
      }
      appointmentsByDate[date].push(appointment)
    })

    return appointmentsByDate
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDay = (date: Date) => {
    return selectedDay ? date.toDateString() === selectedDay.toDateString() : false
  }

  const appointmentsByDate = getAppointmentsByDate()
  const calendarDays = getDaysInMonth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Φόρτωση ραντεβού...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Ημερολόγιο Ραντεβού</CardTitle>
              <CardDescription>
                Επιλέξτε ημερομηνία για να δείτε τα ραντεβού
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowBookingDialog(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Νέο Ραντεβού
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={index} className="p-2 h-16"></div>
              }

              const dateString = date.toDateString()
              const dayAppointments = appointmentsByDate[dateString] || []
              const hasAppointments = dayAppointments.length > 0

              return (
                <div
                  key={index}
                  className={`
                    p-2 h-16 border rounded cursor-pointer transition-colors
                    ${isToday(date) ? 'bg-pink-100 border-pink-300' : 'border-gray-200'}
                    ${isSelectedDay(date) ? 'bg-pink-200 border-pink-400' : ''}
                    ${hasAppointments ? 'bg-blue-50' : ''}
                    hover:bg-gray-50
                  `}
                  onClick={() => handleDayClick(date)}
                >
                  <div className="text-sm font-medium">{date.getDate()}</div>
                  {hasAppointments && (
                    <div className="text-xs text-blue-600 mt-1">
                      {dayAppointments.length} ραντεβού
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Appointments */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>
                Ραντεβού για {selectedDay ? formatDate(selectedDay) : 'Σήμερα'}
              </CardTitle>
              <CardDescription>
                {filteredAppointments.length} ραντεβού
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Φίλτρο κατάστασης" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλα</SelectItem>
                  <SelectItem value="SCHEDULED">Προγραμματισμένα</SelectItem>
                  <SelectItem value="COMPLETED">Ολοκληρωμένα</SelectItem>
                  <SelectItem value="CANCELLED">Ακυρωμένα</SelectItem>
                  <SelectItem value="NO_SHOW">Δεν ήρθαν</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Αναζήτηση..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[200px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Δεν υπάρχουν ραντεβού για αυτή την ημερομηνία</p>
            </div>
          ) : (
            <div className="space-y-2">
              {getAppointmentsByHour().map(({ hour, appointments }) => (
                <div key={hour} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 text-center">
                      <div className="text-lg font-bold text-gray-700">{hour}</div>
                      <div className="text-xs text-gray-500">ώρα</div>
                    </div>
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <div className="text-sm text-gray-600">
                      {appointments.length} ραντεβού
                    </div>
                  </div>
                  
                  <div className="space-y-3 ml-20">
                    {appointments.map((appointment) => (
                      <Card 
                        key={appointment.id} 
                        className="hover:shadow-md transition-shadow cursor-move border-l-4 border-l-pink-500"
                        draggable
                        onDragStart={(e) => handleDragStart(e, appointment)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, hour)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            <GripVertical className="h-4 w-4 text-gray-400 mt-1 cursor-move" />
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                                  <span className="text-pink-600 font-semibold text-xs">
                                    {appointment.customer.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm">{appointment.customer.name}</h4>
                                  <p className="text-xs text-gray-600">{appointment.customer.phone}</p>
                                  {appointment.employee && (
                                    <p className="text-xs text-blue-600 font-medium">Εργαζόμενος: {appointment.employee.name}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-700">
                                    {new Date(appointment.date).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="text-xs text-gray-500">{appointment.totalDuration}min</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-1">
                                  {appointment.services.map((service) => (
                                    <Badge key={service.id} variant="secondary" className="text-xs">
                                      {service.service.name}
                                    </Badge>
                                  ))}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-green-600">€{appointment.totalPrice}</span>
                                  <Badge className={getStatusColor(appointment.status)} variant="outline">
                                    {getStatusText(appointment.status)}
                                  </Badge>
                                </div>
                              </div>
                              
                              {appointment.notes && (
                                <p className="text-xs text-gray-600 mt-2 italic">{appointment.notes}</p>
                              )}
                            </div>
                            
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleEditAppointment(appointment)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Booking Dialog */}
      <AppointmentBookingDialog
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        customer={selectedCustomer}
        onAppointmentCreated={handleAppointmentCreated}
      />

      {/* Edit Appointment Dialog */}
      <AppointmentBookingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        customer={selectedCustomer}
        editingAppointment={editingAppointment}
        onAppointmentCreated={handleAppointmentUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Διαγραφή Ραντεβού"
        description="Είστε σίγουρος ότι θέλετε να διαγράψετε αυτό το ραντεβού; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
        confirmText="Διαγραφή"
        cancelText="Ακύρωση"
        onConfirm={confirmDeleteAppointment}
        variant="destructive"
      />
    </div>
  )
}