"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus, Users, BarChart3, Database, AlertTriangle, RefreshCw, Settings, Home, ArrowLeft, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import EmployeeManagement from "@/components/EmployeeManagement"
import AppointmentsCalendar from "@/components/AppointmentsCalendar"
import CustomerManagement from "@/components/CustomerManagement"
import ServiceManagement from "@/components/ServiceManagement"
import StatisticsDashboard from "@/components/StatisticsDashboard"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  preferences?: string
  createdAt: string
  _count?: {
    appointments: number
  }
}

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  isactive: boolean
}

interface Appointment {
  id: string
  date: string
  status: string
  notes?: string
  totalDuration: number
  totalPrice: number
  customer: Customer
  services: {
    service: Service
  }[]
}

export default function AdminPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // New customer form
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    preferences: ""
  })
  
  // New appointment form
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    customerId: "",
    date: "",
    serviceIds: [] as string[],
    notes: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [customersRes, appointmentsRes, servicesRes] = await Promise.all([
        fetch('/api/customers/list'),
        fetch('/api/appointments'),
        fetch('/api/services')
      ])
      
      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(customersData)
      }
      
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        setAppointments(appointmentsData)
      }
      
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Σφάλμα κατά τη φόρτωση δεδομένων')
    } finally {
      setLoading(false)
    }
  }

  const generateDummyCustomers = async () => {
    setLoading(true)
    setError("")
    setSuccess("")
    
    const dummyCustomers = [
      {
        name: "Μαρία Παπαδοπούλου",
        phone: "6901234567",
        email: "maria@test.com",
        notes: "Προτιμά γαλλικό μανικιρ",
        preferences: "Ροζ χρώματα"
      },
      {
        name: "Ελένη Γεωργίου",
        phone: "6902345678",
        email: "eleni@test.com",
        notes: "Αλλεργική σε ορισμένα προϊόντα",
        preferences: "Φυσικά χρώματα"
      },
      {
        name: "Σοφία Κωνσταντίνου",
        phone: "6903456789",
        email: "sofia@test.com",
        notes: "Τακτική πελάτισσα",
        preferences: "Κόκκινα χρώματα"
      },
      {
        name: "Άννα Δημητρίου",
        phone: "6904567890",
        email: "anna@test.com",
        notes: "Προτιμά spa υπηρεσίες",
        preferences: "Χαλαρωτικές θεραπείες"
      },
      {
        name: "Κατερίνα Νικολάου",
        phone: "6905678901",
        email: "katerina@test.com",
        notes: "Γρήγορες υπηρεσίες",
        preferences: "Απλό μανικιρ"
      }
    ]
    
    try {
      let created = 0
      for (const customer of dummyCustomers) {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customer),
        })
        
        if (response.ok) {
          created++
        }
      }
      
      setSuccess(`Δημιουργήθηκαν ${created} test πελάτες επιτυχώς!`)
      await loadData()
    } catch (error) {
      console.error('Error creating dummy customers:', error)
      setError('Σφάλμα κατά τη δημιουργία test πελατών')
    } finally {
      setLoading(false)
    }
  }

  const createCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      setError('Το όνομα και το τηλέφωνο είναι υποχρεωτικά')
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomer),
      })
      
      if (response.ok) {
        setSuccess('Ο πελάτης δημιουργήθηκε επιτυχώς!')
        setNewCustomer({ name: "", phone: "", email: "", notes: "", preferences: "" })
        setShowNewCustomerDialog(false)
        await loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Σφάλμα κατά τη δημιουργία πελάτη')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      setError('Σφάλμα κατά τη δημιουργία πελάτη')
    } finally {
      setLoading(false)
    }
  }

  const createAppointment = async () => {
    if (!newAppointment.customerId || !newAppointment.date || newAppointment.serviceIds.length === 0) {
      setError('Όλα τα πεδία είναι υποχρεωτικά')
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAppointment),
      })
      
      if (response.ok) {
        setSuccess('Το ραντεβού δημιουργήθηκε επιτυχώς!')
        setNewAppointment({ customerId: "", date: "", serviceIds: [], notes: "" })
        setShowNewAppointmentDialog(false)
        await loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Σφάλμα κατά τη δημιουργία ραντεβού')
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      setError('Σφάλμα κατά τη δημιουργία ραντεβού')
    } finally {
      setLoading(false)
    }
  }

  const deleteAllTestData = async () => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε όλα τα test δεδομένα; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.')) {
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      // Delete all appointments first (due to foreign key constraints)
      for (const appointment of appointments) {
        await fetch(`/api/appointments/${appointment.id}`, {
          method: 'DELETE'
        })
      }
      
      // Then delete all customers
      for (const customer of customers) {
        await fetch(`/api/customers/${customer.id}`, {
          method: 'DELETE'
        })
      }
      
      setSuccess('Όλα τα test δεδομένα διαγράφηκαν επιτυχώς!')
      await loadData()
    } catch (error) {
      console.error('Error deleting test data:', error)
      setError('Σφάλμα κατά τη διαγραφή test δεδομένων')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('el-GR')
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Αρχική Σελίδα</span>
              <Home className="h-4 w-4 sm:hidden" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
            <p className="text-gray-600">Διαχείριση Test Δεδομένων</p>
          </div>
        </div>
        <Button onClick={loadData} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Ανανέωση</span>
        </Button>
      </div>



      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden sm:inline">Επισκόπηση</span>
              <Settings className="h-4 w-4 sm:hidden" />
            </TabsTrigger>
            <TabsTrigger value="appointments-calendar" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden sm:inline">Στατιστικά</span>
              <BarChart3 className="h-4 w-4 sm:hidden" />
            </TabsTrigger>
            <TabsTrigger value="customers-management" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden sm:inline">Πελάτες</span>
              <Users className="h-4 w-4 sm:hidden" />
            </TabsTrigger>
            <TabsTrigger value="services-management" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden sm:inline">Υπηρεσίες</span>
              <Database className="h-4 w-4 sm:hidden" />
            </TabsTrigger>
            <TabsTrigger value="employees" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden lg:inline">Εργαζόμενοι</span>
              <span className="hidden sm:inline lg:hidden">Εργ.</span>
              <Users className="h-4 w-4 sm:hidden" />
            </TabsTrigger>
            <TabsTrigger value="customers" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden lg:inline">Test Πελάτες</span>
              <span className="hidden sm:inline lg:hidden">Test</span>
              <Plus className="h-4 w-4 sm:hidden" />
            </TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden lg:inline">Test Ραντεβού</span>
              <span className="hidden sm:inline lg:hidden">Ραντ.</span>
              <Calendar className="h-4 w-4 sm:hidden" />
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden sm:inline">Ενέργειες</span>
              <Settings className="h-4 w-4 sm:hidden" />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Συνολικοί Πελάτες</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Συνολικά Ραντεβού</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appointments.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Διαθέσιμες Υπηρεσίες</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{services.length}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="appointments-calendar" className="space-y-4">
          <StatisticsDashboard appointments={appointments} />
        </TabsContent>

        {/* Customer Management Tab */}
        <TabsContent value="customers-management" className="space-y-4">
          <CustomerManagement />
        </TabsContent>

        {/* Service Management Tab */}
        <TabsContent value="services-management" className="space-y-4">
          <ServiceManagement />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Πελάτες ({customers.length})</h2>
            <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Νέος Πελάτης
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Δημιουργία Νέου Πελάτη</DialogTitle>
                  <DialogDescription>
                    Προσθέστε έναν νέο test πελάτη
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Όνομα *</Label>
                    <Input
                      id="name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="Εισαγάγετε όνομα"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Τηλέφωνο *</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="Εισαγάγετε τηλέφωνο"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="Εισαγάγετε email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Σημειώσεις</Label>
                    <Textarea
                      id="notes"
                      value={newCustomer.notes}
                      onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                      placeholder="Εισαγάγετε σημειώσεις"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferences">Προτιμήσεις</Label>
                    <Textarea
                      id="preferences"
                      value={newCustomer.preferences}
                      onChange={(e) => setNewCustomer({...newCustomer, preferences: e.target.value})}
                      placeholder="Εισαγάγετε προτιμήσεις"
                    />
                  </div>
                  <Button onClick={createCustomer} disabled={loading} className="w-full">
                    {loading ? 'Δημιουργία...' : 'Δημιουργία Πελάτη'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {customers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{customer.name}</h3>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                      {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
                      {customer.notes && <p className="text-sm text-gray-500 mt-1">{customer.notes}</p>}
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {customer._count?.appointments || 0} ραντεβού
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(customer.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <EmployeeManagement 
            onEmployeeCreated={() => setRefreshTrigger(prev => prev + 1)}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Ραντεβού ({appointments.length})</h2>
            <Dialog open={showNewAppointmentDialog} onOpenChange={setShowNewAppointmentDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Νέο Ραντεβού
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Δημιουργία Νέου Ραντεβού</DialogTitle>
                  <DialogDescription>
                    Προσθέστε ένα νέο test ραντεβού
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customer">Πελάτης *</Label>
                    <Select value={newAppointment.customerId} onValueChange={(value) => setNewAppointment({...newAppointment, customerId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Επιλέξτε πελάτη" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Ημερομηνία & Ώρα *</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Υπηρεσίες *</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {services.map((service) => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={service.id}
                            checked={newAppointment.serviceIds.includes(service.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAppointment({
                                  ...newAppointment,
                                  serviceIds: [...newAppointment.serviceIds, service.id]
                                })
                              } else {
                                setNewAppointment({
                                  ...newAppointment,
                                  serviceIds: newAppointment.serviceIds.filter(id => id !== service.id)
                                })
                              }
                            }}
                          />
                          <label htmlFor={service.id} className="text-sm">
                            {service.name} - {service.duration}min - €{service.price}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="appointmentNotes">Σημειώσεις</Label>
                    <Textarea
                      id="appointmentNotes"
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                      placeholder="Εισαγάγετε σημειώσεις"
                    />
                  </div>
                  <Button onClick={createAppointment} disabled={loading} className="w-full">
                    {loading ? 'Δημιουργία...' : 'Δημιουργία Ραντεβού'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{appointment.customer.name}</h3>
                      <p className="text-sm text-gray-600">{formatDateTime(appointment.date)}</p>
                      <p className="text-sm text-gray-600">
                        {appointment.services.map(s => s.service.name).join(', ')}
                      </p>
                      {appointment.notes && <p className="text-sm text-gray-500 mt-1">{appointment.notes}</p>}
                    </div>
                    <div className="text-right">
                      <Badge variant={appointment.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                        {appointment.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">€{appointment.totalPrice}</p>
                      <p className="text-xs text-gray-500">{appointment.totalDuration}min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Δημιουργία Test Δεδομένων</CardTitle>
                <CardDescription>
                  Δημιουργήστε γρήγορα test πελάτες για δοκιμές
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={generateDummyCustomers} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Δημιουργία...' : 'Δημιουργία 5 Test Πελατών'}
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Διαγραφή Όλων των Test Δεδομένων</CardTitle>
                <CardDescription>
                  Διαγράψτε όλους τους πελάτες και ραντεβού. Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={deleteAllTestData} 
                  disabled={loading || (customers.length === 0 && appointments.length === 0)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {loading ? 'Διαγραφή...' : 'Διαγραφή Όλων των Test Δεδομένων'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}