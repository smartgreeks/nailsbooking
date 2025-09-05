"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus, Edit, Users, Phone, Mail, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  isactive: boolean
}

interface Employee {
  id: string
  name: string
  email?: string
  phone?: string
  specialties?: string
  workingHours?: string
  isActive: boolean
  employeeServices?: {
    service: Service
  }[]
  _count?: {
    appointments: number
  }
}

interface WorkingHours {
  [key: string]: {
    start: string
    end: string
    isWorking: boolean
  }
}

interface EmployeeManagementProps {
  onEmployeeCreated?: () => void
  refreshTrigger?: number
}

export default function EmployeeManagement({ onEmployeeCreated, refreshTrigger }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [creatingEmployee, setCreatingEmployee] = useState(false)
  const [updatingEmployee, setUpdatingEmployee] = useState(false)
  const [deletingEmployees, setDeletingEmployees] = useState<Set<string>>(new Set())
  
  // New employee form
  const [showNewEmployeeDialog, setShowNewEmployeeDialog] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: [] as string[],
    workingHours: {
      monday: { start: "09:00", end: "17:00", isWorking: true },
      tuesday: { start: "09:00", end: "17:00", isWorking: true },
      wednesday: { start: "09:00", end: "17:00", isWorking: true },
      thursday: { start: "09:00", end: "17:00", isWorking: true },
      friday: { start: "09:00", end: "17:00", isWorking: true },
      saturday: { start: "10:00", end: "16:00", isWorking: true },
      sunday: { start: "10:00", end: "16:00", isWorking: false }
    } as WorkingHours,
    isActive: true
  })
  
  // Edit employee form
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editEmployee, setEditEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: [] as string[],
    workingHours: {} as WorkingHours,
    isActive: true
  })

  useEffect(() => {
    console.log('🔄 useEffect triggered, refreshTrigger:', refreshTrigger)
    fetchEmployees()
    fetchServices()
  }, [refreshTrigger])

  const fetchEmployees = async () => {
    console.log('🔄 Fetching employees...')
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const employeesData = await response.json()
        console.log('✅ Employees fetched:', employeesData.length, 'employees')
        setEmployees(employeesData)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setError('Σφάλμα κατά τη φόρτωση εργαζομένων')
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const servicesData = await response.json()
        setServices(servicesData.filter((s: Service) => s.isactive))
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleCreateEmployee = async () => {
    try {
      setCreatingEmployee(true)
      setError("")
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newEmployee.name,
          email: newEmployee.email || null,
          phone: newEmployee.phone || null,
          specialties: newEmployee.specialties,
          workingHours: newEmployee.workingHours,
          isActive: newEmployee.isActive
        })
      })
      
      if (response.ok) {
        setSuccess('Ο εργαζόμενος δημιουργήθηκε επιτυχώς!')
        setShowNewEmployeeDialog(false)
        setNewEmployee({
          name: "",
          email: "",
          phone: "",
          specialties: [],
          workingHours: {
            monday: { start: "09:00", end: "17:00", isWorking: true },
            tuesday: { start: "09:00", end: "17:00", isWorking: true },
            wednesday: { start: "09:00", end: "17:00", isWorking: true },
            thursday: { start: "09:00", end: "17:00", isWorking: true },
            friday: { start: "09:00", end: "17:00", isWorking: true },
            saturday: { start: "10:00", end: "16:00", isWorking: true },
            sunday: { start: "10:00", end: "16:00", isWorking: false }
          },
          isActive: true
        })
        console.log('✅ Employee created successfully, calling fetchEmployees and onEmployeeCreated')
        fetchEmployees()
        onEmployeeCreated?.()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Σφάλμα κατά τη δημιουργία εργαζομένου')
      }
    } catch (error) {
      setError('Σφάλμα κατά τη δημιουργία εργαζομένου')
    } finally {
      setCreatingEmployee(false)
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setEditEmployee({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      specialties: employee.employeeServices?.map(es => es.service.id) || [],
      workingHours: employee.workingHours ? JSON.parse(employee.workingHours) : {
        monday: { start: "09:00", end: "17:00", isWorking: true },
        tuesday: { start: "09:00", end: "17:00", isWorking: true },
        wednesday: { start: "09:00", end: "17:00", isWorking: true },
        thursday: { start: "09:00", end: "17:00", isWorking: true },
        friday: { start: "09:00", end: "17:00", isWorking: true },
        saturday: { start: "10:00", end: "16:00", isWorking: true },
        sunday: { start: "10:00", end: "16:00", isWorking: false }
      },
      isActive: employee.isActive
    })
    setShowEditEmployeeDialog(true)
  }

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return
    
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editEmployee.name,
          email: editEmployee.email || null,
          phone: editEmployee.phone || null,
          specialties: editEmployee.specialties,
          workingHours: editEmployee.workingHours,
          isActive: editEmployee.isActive
        })
      })
      
      if (response.ok) {
        setSuccess('Ο εργαζόμενος ενημερώθηκε επιτυχώς!')
        setShowEditEmployeeDialog(false)
        setEditingEmployee(null)
        fetchEmployees()
        onEmployeeCreated?.()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Σφάλμα κατά την ενημέρωση εργαζομένου')
      }
    } catch (error) {
      setError('Σφάλμα κατά την ενημέρωση εργαζομένου')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον εργαζόμενο;')) {
      return
    }
    
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSuccess('Ο εργαζόμενος διαγράφηκε επιτυχώς!')
        fetchEmployees()
        onEmployeeCreated?.()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Σφάλμα κατά τη διαγραφή εργαζομένου')
      }
    } catch (error) {
      setError('Σφάλμα κατά τη διαγραφή εργαζομένου')
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialtyToggle = (serviceId: string, isNew: boolean = true) => {
    const target = isNew ? newEmployee : editEmployee
    const setter = isNew ? setNewEmployee : setEditEmployee
    
    const currentSpecialties = target.specialties
    const updatedSpecialties = currentSpecialties.includes(serviceId)
      ? currentSpecialties.filter(id => id !== serviceId)
      : [...currentSpecialties, serviceId]
    
    setter(prev => ({
      ...prev,
      specialties: updatedSpecialties
    }))
  }

  const handleWorkingHoursChange = (day: string, field: 'start' | 'end' | 'isWorking', value: string | boolean, isNew: boolean = true) => {
    const target = isNew ? newEmployee : editEmployee
    const setter = isNew ? setNewEmployee : setEditEmployee
    
    setter(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }))
  }

  const getDayName = (day: string) => {
    const dayNames: { [key: string]: string } = {
      monday: 'Δευτέρα',
      tuesday: 'Τρίτη',
      wednesday: 'Τετάρτη',
      thursday: 'Πέμπτη',
      friday: 'Παρασκευή',
      saturday: 'Σάββατο',
      sunday: 'Κυριακή'
    }
    return dayNames[day] || day
  }

  const formatWorkingHours = (workingHours?: string) => {
    if (!workingHours) return 'Δεν έχουν οριστεί'
    
    try {
      const hours = JSON.parse(workingHours) as WorkingHours
      const workingDays = Object.entries(hours)
        .filter(([_, dayInfo]) => dayInfo.isWorking)
        .map(([day, dayInfo]) => `${getDayName(day)}: ${dayInfo.start}-${dayInfo.end}`)
      
      return workingDays.length > 0 ? workingDays.join(', ') : 'Δεν εργάζεται'
    } catch {
      return 'Μη έγκυρα δεδομένα'
    }
  }

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p>Φόρτωση εργαζομένων...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Διαχείριση Εργαζομένων</h2>
          <p className="text-gray-600">Διαχειριστείτε τους εργαζομένους του σαλονιού</p>
        </div>
        
        <Dialog open={showNewEmployeeDialog} onOpenChange={setShowNewEmployeeDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Νέος Εργαζόμενος
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Νέος Εργαζόμενος</DialogTitle>
              <DialogDescription>
                Προσθέστε έναν νέο εργαζόμενο στο σαλόνι
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Όνομα *</Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Όνομα εργαζομένου"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone">Τηλέφωνο</Label>
                <Input
                  id="phone"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="6901234567"
                />
              </div>
              
              <div>
                <Label>Ειδικότητες</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={newEmployee.specialties.includes(service.id)}
                        onCheckedChange={() => handleSpecialtyToggle(service.id, true)}
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-sm">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Ωράριο Εργασίας</Label>
                <div className="space-y-3 mt-2">
                  {Object.entries(newEmployee.workingHours).map(([day, dayInfo]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-20">
                        <Label className="text-sm">{getDayName(day)}</Label>
                      </div>
                      <Switch
                        checked={dayInfo.isWorking}
                        onCheckedChange={(checked) => handleWorkingHoursChange(day, 'isWorking', checked, true)}
                      />
                      {dayInfo.isWorking && (
                        <>
                          <Input
                            type="time"
                            value={dayInfo.start}
                            onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value, true)}
                            className="w-24"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={dayInfo.end}
                            onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value, true)}
                            className="w-24"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newEmployee.isActive}
                  onCheckedChange={(checked) => setNewEmployee(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Ενεργός εργαζόμενος</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowNewEmployeeDialog(false)}>
                Ακύρωση
              </Button>
              <Button onClick={handleCreateEmployee} disabled={!newEmployee.name || creatingEmployee}>
                {creatingEmployee ? 'Δημιουργία...' : 'Δημιουργία'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {employees.map((employee) => (
          <Card key={employee.id} className={`${!employee.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{employee.name}</h3>
                      <div className="flex items-center gap-2">
                        {employee.isActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ενεργός
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Ανενεργός
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {employee.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{employee.email}</span>
                      </div>
                    )}
                    {employee.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{formatWorkingHours(employee.workingHours)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{employee._count?.appointments || 0} ραντεβού</span>
                    </div>
                  </div>
                  
                  {employee.employeeServices && employee.employeeServices.length > 0 && (
                    <div className="mt-3">
                      <Label className="text-sm font-medium">Ειδικότητες:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {employee.employeeServices.map((es) => (
                          <Badge key={es.service.id} variant="outline" className="text-xs">
                            {es.service.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditEmployee(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEmployee(employee.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {employees.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Δεν υπάρχουν εργαζόμενοι</h3>
              <p className="text-gray-600 mb-4">Προσθέστε τον πρώτο εργαζόμενο στο σαλόνι</p>
              <Button onClick={() => setShowNewEmployeeDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Προσθήκη Εργαζομένου
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditEmployeeDialog} onOpenChange={setShowEditEmployeeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Επεξεργασία Εργαζομένου</DialogTitle>
            <DialogDescription>
              Επεξεργαστείτε τα στοιχεία του εργαζομένου
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Όνομα *</Label>
                <Input
                  id="edit-name"
                  value={editEmployee.name}
                  onChange={(e) => setEditEmployee(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Όνομα εργαζομένου"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmployee.email}
                  onChange={(e) => setEditEmployee(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-phone">Τηλέφωνο</Label>
              <Input
                id="edit-phone"
                value={editEmployee.phone}
                onChange={(e) => setEditEmployee(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="6901234567"
              />
            </div>
            
            <div>
              <Label>Ειδικότητες</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-service-${service.id}`}
                      checked={editEmployee.specialties.includes(service.id)}
                      onCheckedChange={() => handleSpecialtyToggle(service.id, false)}
                    />
                    <Label htmlFor={`edit-service-${service.id}`} className="text-sm">
                      {service.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Ωράριο Εργασίας</Label>
              <div className="space-y-3 mt-2">
                {Object.entries(editEmployee.workingHours).map(([day, dayInfo]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-20">
                      <Label className="text-sm">{getDayName(day)}</Label>
                    </div>
                    <Switch
                      checked={dayInfo.isWorking}
                      onCheckedChange={(checked) => handleWorkingHoursChange(day, 'isWorking', checked, false)}
                    />
                    {dayInfo.isWorking && (
                      <>
                        <Input
                          type="time"
                          value={dayInfo.start}
                          onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value, false)}
                          className="w-24"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={dayInfo.end}
                          onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value, false)}
                          className="w-24"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={editEmployee.isActive}
                onCheckedChange={(checked) => setEditEmployee(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>Ενεργός εργαζόμενος</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowEditEmployeeDialog(false)}>
              Ακύρωση
            </Button>
            <Button onClick={handleUpdateEmployee} disabled={!editEmployee.name || loading}>
              {loading ? 'Ενημέρωση...' : 'Ενημέρωση'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}