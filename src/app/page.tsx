"use client"

import { useState } from "react"
import { Search, Phone, Calendar, Users, Star, Plus, Clock, MapPin, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import AppointmentBookingDialog from "@/components/AppointmentBookingDialog"
import AppointmentsCalendar from "@/components/AppointmentsCalendar"
import CustomerManagement from "@/components/CustomerManagement"
import ServiceManagement from "@/components/ServiceManagement"

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  preferences?: string
  appointments: Appointment[]
}

interface Appointment {
  id: string
  date: string
  status: string
  notes?: string
  totalDuration: number
  totalPrice: number
  services: AppointmentService[]
}

interface AppointmentService {
  id: string
  service: Service
}

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
}

export default function NailStudioDashboard() {
  const [searchPhone, setSearchPhone] = useState("")
  const [activeTab, setActiveTab] = useState("search")
  const [searchResult, setSearchResult] = useState<Customer | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false)
  const [appointmentCustomer, setAppointmentCustomer] = useState<Customer | null>(null)
  const [customersRefreshTrigger, setCustomersRefreshTrigger] = useState(0)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    preferences: ""
  })

  const handleSearch = async () => {
    if (!searchPhone.trim()) {
      setSearchError("Παρακαλώ εισαγάγετε αριθμό τηλεφώνου")
      return
    }

    setSearching(true)
    setSearchError("")

    try {
      const response = await fetch(`/api/customers/search?phone=${encodeURIComponent(searchPhone)}`)
      
      if (response.ok) {
        const customer = await response.json()
        setSearchResult(customer)
        setActiveTab("search")
      } else if (response.status === 404) {
        setSearchResult(null)
        setSearchError("Δεν βρέθηκε πελάτης με αυτόν τον αριθμό τηλεφώνου")
      } else {
        setSearchError("Παρουσιάστηκε σφάλμα κατά την αναζήτηση")
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchError("Παρουσιάστηκε σφάλμα κατά την αναζήτηση")
    } finally {
      setSearching(false)
    }
  }

  const handleCreateCustomer = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomer),
      })

      if (response.ok) {
        const customer = await response.json()
        // Make a new search to get the complete customer data with appointments
        setSearchPhone(customer.phone)
        const searchResponse = await fetch(`/api/customers/search?phone=${encodeURIComponent(customer.phone)}`)
        if (searchResponse.ok) {
          const fullCustomerData = await searchResponse.json()
          setSearchResult(fullCustomerData)
        } else {
          // Fallback to the created customer if search fails
          setSearchResult(customer)
        }
        setShowNewCustomerDialog(false)
        setNewCustomer({
          name: "",
          phone: "",
          email: "",
          notes: "",
          preferences: ""
        })
        setSearchError("")
        // Refresh customers list
        setCustomersRefreshTrigger(prev => prev + 1)
      } else {
        const error = await response.json()
        setSearchError(error.error || "Παρουσιάστηκε σφάλμα κατά τη δημιουργία πελάτη")
      }
    } catch (error) {
      console.error('Create customer error:', error)
      setSearchError("Παρουσιάστηκε σφάλμα κατά τη δημιουργία πελάτη")
    }
  }

  const handleBookAppointment = (customer: Customer) => {
    setAppointmentCustomer(customer)
    setShowAppointmentDialog(true)
  }

  const handleAppointmentCreated = () => {
    // Refresh search results if we have a customer
    if (searchResult) {
      handleSearch()
    }
  }

  const handleCustomerUpdated = () => {
    // Refresh customers list and search results if needed
    setCustomersRefreshTrigger(prev => prev + 1)
    if (searchResult) {
      handleSearch()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center py-4 sm:py-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
            Nail Studio
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Διαχείριση Ραντεβού & Πελατών
          </p>
        </header>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-1 mb-24 sm:mb-8 pb-4 bg-white rounded-lg p-3 shadow-sm sticky top-4 z-10">
            <TabsTrigger value="search" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-4 sm:p-2 text-xs sm:text-sm border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors data-[state=active]:bg-pink-100 data-[state=active]:border-pink-500 data-[state=active]:text-pink-700">
              <Phone className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Αναζήτηση</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-4 sm:p-2 text-xs sm:text-sm border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors data-[state=active]:bg-pink-100 data-[state=active]:border-pink-500 data-[state=active]:text-pink-700">
              <Calendar className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Ραντεβού</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-4 sm:p-2 text-xs sm:text-sm border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors data-[state=active]:bg-pink-100 data-[state=active]:border-pink-500 data-[state=active]:text-pink-700">
              <Users className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Πελάτες</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-4 sm:p-2 text-xs sm:text-sm border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors data-[state=active]:bg-pink-100 data-[state=active]:border-pink-500 data-[state=active]:text-pink-700">
              <Settings className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Υπηρεσίες</span>
            </TabsTrigger>
          </TabsList>

          {/* Search Customer Tab */}
          <TabsContent value="search" className="space-y-4 sm:space-y-6 pt-4 sm:pt-0">
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Αναζήτηση Πελάτη με Αριθμό Τηλεφώνου
                </CardTitle>
                <CardDescription>
                  Εισαγάγετε τον αριθμό τηλεφώνου για να βρείτε τα στοιχεία του πελάτη
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Εισαγάγετε αριθμό τηλεφώνου..."
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto"
                    onClick={handleSearch}
                    disabled={searching}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {searching ? 'Αναζήτηση...' : 'Αναζήτηση'}
                  </Button>
                </div>

                {searchError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{searchError}</p>
                  </div>
                )}

                {/* Search Result */}
                {searchResult && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="text-lg">Βρέθηκε Πελάτης</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Όνομα</Label>
                          <p className="font-semibold">{searchResult.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Τηλέφωνο</Label>
                          <p className="font-semibold">{searchResult.phone}</p>
                        </div>
                        {searchResult.email && (
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Email</Label>
                            <p className="font-semibold">{searchResult.email}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Σύνολο Ραντεβού</Label>
                          <p className="font-semibold">{searchResult.appointments?.length || 0}</p>
                        </div>
                      </div>

                      {searchResult.preferences && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Προτιμήσεις</Label>
                          <p className="text-sm mt-1">{searchResult.preferences}</p>
                        </div>
                      )}

                      {searchResult.notes && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Σημειώσεις</Label>
                          <p className="text-sm mt-1">{searchResult.notes}</p>
                        </div>
                      )}

                      {/* Recent Appointments */}
                      {searchResult.appointments && searchResult.appointments.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500 mb-2 block">Πρόσφατα Ραντεβού</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {searchResult.appointments?.slice(0, 3).map((appointment) => (
                              <div key={appointment.id} className="p-2 bg-gray-50 rounded-md">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {formatDateTime(appointment.date)}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {appointment.services.map(s => s.service.name).join(', ')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                      {getStatusText(appointment.status)}
                                    </span>
                                    <p className="text-sm font-medium mt-1">{appointment.totalPrice}€</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button 
                          className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto"
                          onClick={() => searchResult && handleBookAppointment(searchResult)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Νέο Ραντεβού
                        </Button>
                        <Button variant="outline" className="w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          Επεξεργασία
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-4 mt-4 sm:mt-6">
                  <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
                    <DialogTrigger asChild>
                      <Card className="border-dashed border-2 border-gray-300 cursor-pointer hover:border-pink-400 transition-colors">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <Phone className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-gray-400" />
                          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Νέος Πελάτης;</p>
                          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                            Προσθήκη Πελάτη
                          </Button>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Προσθήκη Νέου Πελάτη</DialogTitle>
                        <DialogDescription>
                          Συμπληρώστε τα στοιχεία του νέου πελάτη
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
                            placeholder="Εισαγάγετε email (προαιρετικό)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="preferences">Προτιμήσεις</Label>
                          <Textarea
                            id="preferences"
                            value={newCustomer.preferences}
                            onChange={(e) => setNewCustomer({...newCustomer, preferences: e.target.value})}
                            placeholder="Προτιμήσεις πελάτη (π.χ. χρώματα, στυλ, αλλεργίες)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Σημειώσεις</Label>
                          <Textarea
                            id="notes"
                            value={newCustomer.notes}
                            onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                            placeholder="Γενικές σημειώσεις για τον πελάτη"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleCreateCustomer} className="bg-pink-600 hover:bg-pink-700">
                            Αποθήκευση Πελάτη
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewCustomerDialog(false)}>
                            Ακύρωση
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Card 
                    className="border-dashed border-2 border-gray-300 cursor-pointer hover:border-pink-400 transition-colors"
                    onClick={() => {
                      setAppointmentCustomer(null)
                      setShowAppointmentDialog(true)
                    }}
                  >
                    <CardContent className="p-3 sm:p-4 text-center">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-gray-400" />
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Γρήγορο Ραντεβού</p>
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                        Νέο Ραντεβού
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4 sm:space-y-6 pt-4 sm:pt-0">
            <AppointmentsCalendar 
              onAppointmentCreated={handleAppointmentCreated}
              refreshTrigger={customersRefreshTrigger}
            />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4 sm:space-y-6 pt-4 sm:pt-0">
            <CustomerManagement 
              refreshTrigger={customersRefreshTrigger}
              onCustomerUpdated={handleCustomerUpdated}
            />
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4 sm:space-y-6 pt-4 sm:pt-0">
            <ServiceManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* Appointment Booking Dialog */}
      <AppointmentBookingDialog
        open={showAppointmentDialog}
        onOpenChange={setShowAppointmentDialog}
        customer={appointmentCustomer}
        onAppointmentCreated={handleAppointmentCreated}
      />
    </div>
  )
}