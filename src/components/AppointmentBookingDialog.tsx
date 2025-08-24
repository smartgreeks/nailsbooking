"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, DollarSign, Users, Plus, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"

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

interface AppointmentBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  onAppointmentCreated?: () => void
}

export default function AppointmentBookingDialog({
  open,
  onOpenChange,
  customer,
  onAppointmentCreated
}: AppointmentBookingDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [services, setServices] = useState<Service[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customer || null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dateError, setDateError] = useState("")

  useEffect(() => {
    if (open) {
      fetchServices()
      fetchCustomers()
      // Set default date to today
      const today = new Date()
      setSelectedDate(today)
      setSelectedCustomer(customer || null)
    } else {
      // Reset form when dialog closes
      setSelectedServices([])
      setNotes("")
      setSelectedTime("")
      setCustomerSearch("")
      setShowCustomerSearch(false)
      setError("")
      setDateError("")
      setSelectedDate(undefined)
    }
  }, [open, customer])

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
    if (!selectedCustomer || !selectedDate || !selectedTime || selectedServices.length === 0) {
      setError("Παρακαλώ συμπληρώστε όλα τα απαιτούμενα πεδία")
      return
    }

    if (!validateDate(selectedDate)) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const appointmentDateTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${selectedTime}`)
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          date: appointmentDateTime.toISOString(),
          serviceIds: selectedServices,
          notes
        }),
      })

      if (response.ok) {
        // Reset form
        setSelectedServices([])
        setNotes("")
        setSelectedTime("")
        setCustomerSearch("")
        setShowCustomerSearch(false)
        setDateError("")
        setSelectedDate(undefined)
        onOpenChange(false)
        onAppointmentCreated?.()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Παρουσιάστηκε σφάλμα κατά τη δημιουργία ραντεβού")
      }
    } catch (error) {
      console.error('Create appointment error:', error)
      setError("Παρουσιάστηκε σφάλμα κατά τη δημιουργία ραντεβού")
    } finally {
      setLoading(false)
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
            Νέο Ραντεβού
          </DialogTitle>
          <DialogDescription>
            {selectedCustomer ? `Κράτηση ραντεβού για ${selectedCustomer.name}` : 'Επιλέξτε πελάτη και υπηρεσίες για το ραντεβού'}
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
              disabled={loading || !selectedCustomer || !selectedDate || !selectedTime || selectedServices.length === 0 || !!dateError}
            >
              {loading ? 'Δημιουργία...' : 'Κράτηση Ραντεβού'}
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