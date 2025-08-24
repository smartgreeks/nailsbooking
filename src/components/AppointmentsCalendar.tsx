"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, DollarSign, Users, Filter, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import AppointmentBookingDialog from "@/components/AppointmentBookingDialog"
import StatisticsDashboard from "@/components/StatisticsDashboard"

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
  services: AppointmentService[]
}

interface AppointmentsCalendarProps {
  onAppointmentCreated?: () => void
  refreshTrigger?: number
}

export default function AppointmentsCalendar({ onAppointmentCreated, refreshTrigger }: AppointmentsCalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [refreshTrigger])

  useEffect(() => {
    filterAppointments()
  }, [appointments, statusFilter, searchTerm, currentDate, viewMode, selectedDay])

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

    // Date filter based on view mode and selected day
    if (viewMode === 'month' && selectedDay) {
      // Show appointments for the selected day only
      filtered = filtered.filter(app => {
        const appDate = new Date(app.date)
        return appDate.toDateString() === selectedDay.toDateString()
      })
    } else {
      // Original filtering logic for other view modes
      const now = new Date()
      switch (viewMode) {
        case 'day':
          filtered = filtered.filter(app => {
            const appDate = new Date(app.date)
            return appDate.toDateString() === now.toDateString()
          })
          break
        case 'week':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          filtered = filtered.filter(app => {
            const appDate = new Date(app.date)
            return appDate >= weekStart && appDate <= weekEnd
          })
          break
        case 'month':
        default:
          filtered = filtered.filter(app => {
            const appDate = new Date(app.date)
            return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear()
          })
          break
      }
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
      {/* Statistics Dashboard */}
      <StatisticsDashboard appointments={appointments} />

      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Ραντεβού</CardTitle>
              <CardDescription>
                Διαχείριση όλων των ραντεβού του σαλονιού
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button 
                onClick={() => setShowBookingDialog(true)}
                className="bg-pink-600 hover:bg-pink-700 h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Νέο Ραντεβού
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* View Mode and Navigation */}
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: 'month' | 'week' | 'day') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Μήνας</SelectItem>
                  <SelectItem value="week">Εβδομάδα</SelectItem>
                  <SelectItem value="day">Ημέρα</SelectItem>
                </SelectContent>
              </Select>
              
              {viewMode === 'month' && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="outline" size="default" onClick={() => navigateMonth('prev')} className="h-10 sm:h-11 px-3 sm:px-4">
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <span className="font-medium min-w-[120px] text-center text-sm sm:text-base">
                    {currentDate.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button variant="outline" size="default" onClick={() => navigateMonth('next')} className="h-10 sm:h-11 px-3 sm:px-4">
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 sm:w-40 h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="Κατάσταση" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλες οι καταστάσεις</SelectItem>
                  <SelectItem value="SCHEDULED">Προγραμματισμένα</SelectItem>
                  <SelectItem value="COMPLETED">Ολοκληρωμένα</SelectItem>
                  <SelectItem value="CANCELLED">Ακυρωμένα</SelectItem>
                  <SelectItem value="NO_SHOW">Δεν ήρθαν</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Αναζήτηση..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-40 sm:w-48 h-10 sm:h-11 text-sm"
                />
              </div>

              {selectedDay && (
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={() => setSelectedDay(null)}
                  className="h-10 sm:h-11 px-3 sm:px-4 text-sm"
                >
                  Εκκαθάριση επιλογής
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {viewMode === 'month' && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
              {['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'].map((day) => (
                <div key={day} className="text-center font-medium text-sm text-gray-600 p-2 sm:p-3">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const dateStr = (date as Date).toDateString()
                const dayAppointments = appointmentsByDate[dateStr] || []
                const isCurrentMonth = (date as Date).getMonth() === currentDate.getMonth()

                return (
                  <div
                    key={dateStr}
                    onClick={() => isCurrentMonth && handleDayClick(date)}
                    className={`aspect-square min-h-[60px] sm:min-h-[80px] border rounded-lg p-2 sm:p-3 overflow-hidden cursor-pointer transition-colors touch-manipulation ${
                      isCurrentMonth 
                        ? isSelectedDay(date) 
                          ? 'bg-pink-100 border-pink-500' 
                          : 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50'
                    } ${isToday(date) ? 'ring-2 ring-pink-500' : ''}`}
                  >
                    <div className={`text-sm sm:text-base font-medium mb-1 sm:mb-2 ${
                      isCurrentMonth 
                        ? isSelectedDay(date) 
                          ? 'text-pink-700' 
                          : 'text-gray-900'
                        : 'text-gray-400'
                    }`}>
                      {(date as Date).getDate()}
                    </div>
                    
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {dayAppointments.slice(0, 3).map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`text-xs p-1 sm:p-1.5 rounded cursor-pointer hover:opacity-80 touch-manipulation ${getStatusColor(appointment.status)}`}
                          title={`${appointment.customer.name} - ${appointment.services.map(s => s.service.name).join(', ')}`}
                        >
                          <div className="font-medium truncate">
                            {new Date(appointment.date).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="truncate">
                            {appointment.customer.name}
                          </div>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayAppointments.length - 3} περισσότερα
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            {viewMode === 'month' && selectedDay && (
              <>Ραντεβού για {formatDate(selectedDay)}</>
            )}
            {viewMode === 'month' && !selectedDay && 'Μηνιαία Ραντεβού'}
            {viewMode === 'day' && 'Σημερινά Ραντεβού'}
            {viewMode === 'week' && 'Εβδομαδιαία Ραντεβού'}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {filteredAppointments.length} ραντεβού βρέθηκαν
            {selectedDay && (
              <span className="ml-2 text-sm text-gray-500">
                (Επιλεγμένη ημέρα: {selectedDay.toLocaleDateString('el-GR')})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-sm sm:text-base">
                {selectedDay 
                  ? `Δεν βρέθηκαν ραντεβού για ${formatDate(selectedDay)}`
                  : 'Δεν βρέθηκαν ραντεβού'
                }
              </p>
              {selectedDay && (
                <Button 
                  variant="outline" 
                  className="mt-4 h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
                  onClick={() => setSelectedDay(null)}
                >
                  Επιστροφή σε μηνιαία προβολή
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-full flex items-center justify-center">
                            <span className="text-pink-600 font-semibold text-sm sm:text-base">
                              {appointment.customer.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm sm:text-base">{appointment.customer.name}</h4>
                            <p className="text-sm text-gray-600">{appointment.customer.phone}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{formatDateTime(appointment.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>{appointment.totalPrice}€</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">Διάρκεια:</span>
                            <span>{appointment.totalDuration} λεπτά</span>
                          </div>
                        </div>
                        
                        {appointment.services.length > 0 && (
                          <div className="mt-2 sm:mt-3">
                            <div className="flex flex-wrap gap-1">
                              {appointment.services.map((service) => (
                                <Badge key={service.id} variant="secondary" className="text-xs">
                                  {service.service.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {appointment.notes && (
                          <p className="text-sm text-gray-600 mt-2 sm:mt-3">{appointment.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusText(appointment.status)}
                        </Badge>
                        
                        <div className="flex gap-2 sm:gap-3">
                          <Button variant="outline" size="default" className="h-8 sm:h-9 w-8 sm:w-9 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="default" className="h-8 sm:h-9 w-8 sm:w-9 p-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
    </div>
  )
}