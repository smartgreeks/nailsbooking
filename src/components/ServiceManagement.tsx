"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Clock, DollarSign, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  isactive: boolean
  createdAt: string
  updatedAt: string
}

export default function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [updatingServices, setUpdatingServices] = useState<Set<string>>(new Set())
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    duration: 30,
    price: 20,
    isactive: true
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services/admin', { cache: 'no-store' })
      if (response.ok) {
        const servicesData = await response.json()
        setServices(servicesData)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleCreateService = async () => {
    if (!newService.name.trim()) {
      alert("Παρακαλώ εισαγάγετε όνομα υπηρεσίας")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newService),
      })

      if (response.ok) {
        const createdService = await response.json()
        
        // Show success notification
        toast({
          title: "Επιτυχής δημιουργία!",
          description: `Η υπηρεσία "${createdService.name}" δημιουργήθηκε επιτυχώς.`,
        })
        
        await fetchServices()
        setShowAddDialog(false)
        setNewService({
          name: "",
          description: "",
          duration: 30,
          price: 20,
          isactive: true
        })
      } else {
        const error = await response.json()
        toast({
          title: "Σφάλμα",
          description: error.error || "Παρουσιάστηκε σφάλμα κατά τη δημιουργία της υπηρεσίας.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating service:', error)
      toast({
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά τη δημιουργία της υπηρεσίας.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateService = async (serviceId: string, updates: Partial<Service>) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await fetchServices()
        setEditingService(null)
      } else {
        const error = await response.json()
        alert(error.error || "Παρουσιάστηκε σφάλμα")
      }
    } catch (error) {
      console.error('Error updating service:', error)
      alert("Παρουσιάστηκε σφάλμα")
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την υπηρεσία;")) {
      return
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchServices()
      } else {
        const error = await response.json()
        alert(error.error || "Παρουσιάστηκε σφάλμα")
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      alert("Παρουσιάστηκε σφάλμα")
    }
  }

  const handleToggleActive = async (serviceId: string, isactive: boolean) => {
    // Add service to updating set
    setUpdatingServices(prev => new Set(prev).add(serviceId))
    
    try {
      await handleUpdateService(serviceId, { isactive })
      const serviceName = services.find(s => s.id === serviceId)?.name || "Υπηρεσία"
      toast({
        title: "Επιτυχής ενημέρωση",
        description: `Η υπηρεσία "${serviceName}" ${isactive ? 'ενεργοποιήθηκε' : 'απενεργοποιήθηκε'} επιτυχώς.`,
      })
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά την αλλαγή κατάστασης της υπηρεσίας.",
        variant: "destructive",
      })
    } finally {
      // Remove service from updating set
      setUpdatingServices(prev => {
        const newSet = new Set(prev)
        newSet.delete(serviceId)
        return newSet
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)}€`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Διαχείριση Υπηρεσιών</h2>
          <p className="text-gray-600">Διαχειριστείτε τις υπηρεσίες του nail studio</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Νέα Υπηρεσία
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Προσθήκη Νέας Υπηρεσίας</DialogTitle>
              <DialogDescription>
                Συμπληρώστε τα στοιχεία της νέας υπηρεσίας
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Όνομα Υπηρεσίας *</Label>
                <Input
                  id="name"
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  placeholder="π.χ. Μανικιρ Βασικό"
                />
              </div>
              <div>
                <Label htmlFor="description">Περιγραφή</Label>
                <Textarea
                  id="description"
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  placeholder="Προσθέστε περιγραφή (προαιρετικό)"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Διάρκεια (λεπτά) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newService.duration}
                    onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value) || 0})}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Τιμή (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value) || 0})}
                    min="0"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isactive"
                  checked={newService.isactive}
                  onCheckedChange={(checked) => setNewService({...newService, isactive: checked})}
                />
                <Label htmlFor="isactive">Ενεργή υπηρεσία</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateService}
                  disabled={loading}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {loading ? 'Δημιουργία...' : 'Δημιουργία'}
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Ακύρωση
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν υπηρεσίες</h3>
            <p className="text-gray-600 mb-4">
              Προσθέστε την πρώτη σας υπηρεσία για να μπορέσετε να δημιουργείτε ραντεβού
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Προσθήκη Υπηρεσίας
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className={!service.isactive ? "opacity-60" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium">{service.name}</h3>
                      {!service.isactive && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Ανενεργή
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {service.duration} λεπτά
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(service.price)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={service.isactive}
                        onCheckedChange={(checked) => handleToggleActive(service.id, checked)}
                        disabled={updatingServices.has(service.id)}
                        className="transition-colors duration-200"
                      />
                      {updatingServices.has(service.id) && (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingService(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteService(service.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingService && (
        <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Επεξεργασία Υπηρεσίας</DialogTitle>
              <DialogDescription>
                Τροποποιήστε τα στοιχεία της υπηρεσίας
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Όνομα Υπηρεσίας *</Label>
                <Input
                  id="edit-name"
                  value={editingService.name}
                  onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Περιγραφή</Label>
                <Textarea
                  id="edit-description"
                  value={editingService.description || ""}
                  onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-duration">Διάρκεια (λεπτά) *</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={editingService.duration}
                    onChange={(e) => setEditingService({...editingService, duration: parseInt(e.target.value) || 0})}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Τιμή (€) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingService.price}
                    onChange={(e) => setEditingService({...editingService, price: parseFloat(e.target.value) || 0})}
                    min="0"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isactive"
                  checked={editingService.isactive}
                  onCheckedChange={(checked) => setEditingService({...editingService, isactive: checked})}
                />
                <Label htmlFor="edit-isactive">Ενεργή υπηρεσία</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleUpdateService(editingService.id, editingService)}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  Αποθήκευση
                </Button>
                <Button variant="outline" onClick={() => setEditingService(null)}>
                  Ακύρωση
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}