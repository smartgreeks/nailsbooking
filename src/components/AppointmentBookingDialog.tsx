"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, DollarSign, Users, Plus, X, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/hooks/use-toast"

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
}

interface Employee {
  id: string
  name: string
  email?: string
  phone?: string
  isActive: boolean
  employeeServices: {
    service: Service
  }[]
}

interface AvailableEmployee extends Employee {
  isAvailable: boolean
  availableSlots: { start: string; end: string }[]
  reason?: string
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
  services: {
    id: string
    service: Service
  }[]
}

interface AppointmentBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  editingAppointment?: Appointment | null
  onAppointmentCreated?: () => void
}

export default function AppointmentBookingDialog({
  open,
  onOpenChange,
  customer,
  editingAppointment,
  onAppointmentCreated
}: AppointmentBookingDialogProps) {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("") 
  const [notes, setNotes] = useState("")
  const [services, setServices] = useState<Service[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [availableEmployees, setAvailableEmployees] = useState<AvailableEmployee[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customer || null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [creatingAppointment, setCreatingAppointment] = useState(false)
  const [error, setError] = useState("")
  const [dateError, setDateError] = useState("")

  useEffect(() => {
    if (open) {
      fetchServices()
      fetchCustomers()
      fetchEmployees()
      
      if (editingAppointment) {
        // Load existing appointment data
        const appointmentDate = new Date(editingAppointment.date)
        setSelectedDate(appointmentDate)
        setSelectedTime(appointmentDate.toTimeString().slice(0, 5))
        setSelectedServices(editingAppointment.services.map(s => s.service.id))
        setSelectedEmployee(editingAppointment.employee?.id || "")
        setNotes(editingAppointment.notes || "")
        setSelectedCustomer(editingAppointment.customer)
      } else {
        // Set default date to today for new appointments
        const today = new Date()
        setSelectedDate(today)
        setSelectedCustomer(customer || null)
      }
    } else {
      // Reset form when dialog closes
      setSelectedServices([])
      setSelectedEmployee("")
      setNotes("")
      setSelectedTime("")
      setCustomerSearch("")
      setShowCustomerSearch(false)
      setError("")
      setDateError("")
      setSelectedDate(undefined)
      setAvailableEmployees([])
    }
  }, [open, customer, editingAppointment])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const servicesData = await response.json()
        setServices(servicesData)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers/list')
      if (response.ok) {
        const customersData = await response.json()
        setCustomers(customersData)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const employeesData = await response.json()
        setEmployees(employeesData)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchAvailableEmployees = async () => {
    if (!selectedDate || selectedServices.length === 0) {
      setAvailableEmployees([])
      return
    }

    setLoadingAvailability(true)
    try {
      const serviceId = selectedServices[0] // Use first selected service for availability check
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      const response = await fetch(`/api/employees/availability?serviceId=${serviceId}&date=${dateStr}`)
      if (response.ok) {
        const availabilityData = await response.json()
        let employees = availabilityData.employees || []
        
        // If a time is selected, filter employees who are available at that specific time
        if (selectedTime) {
          employees = employees.filter(employee => {
            if (!employee.availableSlots) return false
            return employee.availableSlots.some(slot => slot.start === selectedTime)
          })
          
          // Clear selected employee if they are no longer available at the selected time
          if (selectedEmployee && !employees.find(emp => emp.id === selectedEmployee)) {
            setSelectedEmployee("")
          }
        }
        
        setAvailableEmployees(employees)
      }
    } catch (error) {
      console.error('Error fetching employee availability:', error)
    } finally {
      setLoadingAvailability(false)
    }
  }

  // Fetch availability when date, services, or time change
  useEffect(() => {
    fetchAvailableEmployees()
  }, [selectedDate, selectedServices, selectedTime])

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, serviceId])
    } else {
      setSelectedServices(selectedServices.filter(id => id !== serviceId))
    }
  }

  const calculateTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId)
      return total + (service?.price || 0)
    }, 0)
  }

  const calculateDuration = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId)
      return total + (service?.duration || 0)
    }, 0)
  }

  const generateTimeSlots = () => {
    const slots: string[] = []
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    return slots
  }

  const validateDate = (date: Date | undefined) => {
    if (!date) {
      setDateError("Παρακαλώ επιλέξτε ημερομηνία")
      return false
    }
    
    // Check if date is not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) {
      setDateError("Η ημερομηνία δεν μπορεί να είναι στο παρελθόν")
      return false
    }
    
    setDateError("")
    return true
  }

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      validateDate(date)
    } else {
      setDateError("")
    }
  }

  const handleCreateAppointment = async () => {
    if (!selectedCustomer || !selectedDate || !selectedTime || selectedServices.length === 0 || !selectedEmployee) {
      setError("Παρακαλώ συμπληρώστε όλα τα απαιτούμενα πεδία")
      return
    }

    if (!validateDate(selectedDate)) {
      return
    }

    setCreatingAppointment(true)
    setError("")

    try {
      // Create proper datetime by combining date and time
      const appointmentDateTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(':')
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const isEditing = !!editingAppointment
      const url = isEditing ? `/api/appointments/${editingAppointment.id}` : '/api/appointments'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          date: appointmentDateTime.toISOString(),
          serviceIds: selectedServices,
          employeeId: selectedEmployee,
          notes
        }),
      })

      if (response.ok) {
        // Show success notification
        toast({
          title: isEditing ? "Επιτυχής ενημέρωση!" : "Επιτυχής κράτηση!",
          description: isEditing ? "Το ραντεβού ενημερώθηκε επιτυχώς." : "Το ραντεβού δημιουργήθηκε επιτυχώς.",
        })
        
        // Reset form
        setSelectedServices([])
        setSelectedEmployee("")
        setNotes("")
        setSelectedTime("")
        setCustomerSearch("")
        setShowCustomerSearch(false)
        setDateError("")
        setSelectedDate(undefined)
        setAvailableEmployees([])
        onOpenChange(false)
        onAppointmentCreated?.()
      } else {
        const errorData = await response.json()
        setError(errorData.error || (isEditing ? "Παρουσιάστηκε σφάλμα κατά την ενημέρωση ραντεβού" : "Παρουσιάστηκε σφάλμα κατά τη δημιουργία ραντεβού"))
      }
    } catch (error) {
      console.error('Create/Update appointment error:', error)
      setError(editingAppointment ? "Παρουσιάστηκε σφάλμα κατά την ενημέρωση ραντεβού" : "Παρουσιάστηκε σφάλμα κατά τη δημιουργία ραντεβού")
    } finally {
      setCreatingAppointment(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  )

  const timeSlots = generateTimeSlots()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {editingAppointment ? 'Επεξεργασία Ραντεβού' : 'Νέο Ραντεβού'}
          </DialogTitle>
          <DialogDescription>
            {editingAppointment 
              ? `Επεξεργασία ραντεβού για ${selectedCustomer?.name}` 
              : (selectedCustomer ? `Κράτηση ραντεβού για ${selectedCustomer.name}` : 'Επιλέξτε πελάτη και υπηρεσίες για το ραντεβού')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Πελάτης *
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(null)
                        setShowCustomerSearch(true)
                      }}
                    >
                      Αλλαγή
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {!showCustomerSearch ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowCustomerSearch(true)}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Επιλέξτε Πελάτη
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Αναζήτηση πελάτη (όνομα ή τηλέφωνο)..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {filteredCustomers.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            {customerSearch ? 'Δεν βρέθηκαν πελάτες' : 'Ξεκινήστε να πληκτρολογείτε για αναζήτηση'}
                          </p>
                        ) : (
                          filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setShowCustomerSearch(false)
                                setCustomerSearch("")
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-sm text-gray-600">{customer.phone}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowCustomerSearch(false)
                          setCustomerSearch("")
                        }}
                      >
                        Ακύρωση
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Ημερομηνία *</Label>
              <DatePicker
                date={selectedDate}
                onSelect={handleDateChange}
                placeholder="Επιλέξτε ημερομηνία"
                className={dateError ? "border-red-500" : ""}
              />
              {dateError && (
                <p className="text-sm text-red-600 mt-1">{dateError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="time">Ώρα *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Επιλέξτε ώρα" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Services */}
          <div>
            <Label className="text-base font-medium mb-3 block">Υπηρεσίες *</Label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {services.map((service) => (
                <Card key={service.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => handleServiceToggle(service.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <Label htmlFor={service.id} className="font-medium cursor-pointer">
                              {service.name}
                            </Label>
                            {service.description && (
                              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              {service.duration} λεπτά
                            </div>
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <DollarSign className="h-3 w-3" />
                              {service.price}€
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Employee Selection */}
          {selectedServices.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Επιλογή Εργαζομένου *
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAvailability ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">Φόρτωση διαθεσιμότητας...</p>
                  </div>
                ) : availableEmployees.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">Δεν υπάρχουν διαθέσιμοι εργαζόμενοι για την επιλεγμένη ημερομηνία και υπηρεσία</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableEmployees.map((employee) => (
                      <Card 
                        key={employee.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedEmployee === employee.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedEmployee(employee.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  selectedEmployee === employee.id ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                                <h4 className="font-medium">{employee.name}</h4>
                              </div>
                              {employee.email && (
                                <p className="text-sm text-gray-600 mt-1">{employee.email}</p>
                              )}
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">
                                  Ειδικότητες: {employee.employeeServices.map(es => es.service.name).join(', ')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                employee.isAvailable 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {employee.isAvailable ? 'Διαθέσιμος' : 'Μη Διαθέσιμος'}
                              </span>
                            </div>
                          </div>
                          {employee.isAvailable && employee.availableSlots.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-2">Διαθέσιμες ώρες:</p>
                              <div className="flex flex-wrap gap-1">
                                {employee.availableSlots.slice(0, 6).map((slot, index) => (
                                  <span 
                                    key={index}
                                    className="inline-block px-2 py-1 bg-gray-100 text-xs rounded"
                                  >
                                    {slot.start} - {slot.end}
                                  </span>
                                ))}
                                {employee.availableSlots.length > 6 && (
                                  <span className="text-xs text-gray-500">+{employee.availableSlots.length - 6} περισσότερες</span>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Σημειώσεις</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Προσθέστε σημειώσεις για το ραντεβού (προαιρετικό)"
              rows={3}
            />
          </div>

          {/* Summary */}
          {selectedServices.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Σύνοψη</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Επιλεγμένες Υπηρεσίες:</span>
                    <span className="text-sm font-medium">
                      {selectedServices.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Συνολική Διάρκεια:</span>
                    <span className="text-sm font-medium">
                      {calculateDuration()} λεπτά
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Συνολικό Κόστος:</span>
                    <span className="text-sm font-medium">
                      {calculateTotal()}€
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateAppointment}
              className="bg-pink-600 hover:bg-pink-700 flex-1"
              disabled={creatingAppointment || !selectedCustomer || !selectedDate || !selectedTime || selectedServices.length === 0 || !selectedEmployee || !!dateError}
            >
              {creatingAppointment 
                ? (editingAppointment ? 'Ενημέρωση...' : 'Δημιουργία...') 
                : (editingAppointment ? 'Ενημέρωση Ραντεβού' : 'Κράτηση Ραντεβού')
              }
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Ακύρωση
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}