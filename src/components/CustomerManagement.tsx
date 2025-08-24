"use client"

import { useState, useEffect } from "react"
import { Edit, Trash2, Phone, Mail, Calendar, Star, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  preferences?: string
  createdAt: string
  updatedAt: string
  _count: {
    appointments: number
  }
}

interface CustomerManagementProps {
  refreshTrigger?: number
  onCustomerUpdated?: () => void
}

export default function CustomerManagement({ refreshTrigger, onCustomerUpdated }: CustomerManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    preferences: ""
  })

  useEffect(() => {
    fetchCustomers()
  }, [refreshTrigger])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers/list')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer)
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      notes: customer.notes || "",
      preferences: customer.preferences || ""
    })
  }

  const handleSaveEdit = async () => {
    if (!editingCustomer) return

    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        await fetchCustomers()
        setEditingCustomer(null)
        onCustomerUpdated?.()
      } else {
        console.error('Failed to update customer')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Είστε σίγουρος ότι θέλετε να διαγράψετε αυτόν τον πελάτη;')) {
      return
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCustomers()
        onCustomerUpdated?.()
      } else {
        console.error('Failed to delete customer')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-pink-100 text-pink-600',
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-indigo-100 text-indigo-600'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Φόρτωση πελατών...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Διαχείριση Πελατών</CardTitle>
              <CardDescription>
                Δείτε και διαχειριστείτε όλους τους πελάτες του σαλονιού ({customers.length} συνολικά)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Customers Grid */}
      {customers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν πελάτες</h3>
            <p className="text-gray-500 mb-4">Ξεκινήστε προσθέτοντας τον πρώτο σας πελάτη</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow relative group">
              <CardContent className="p-4 sm:p-5">
                {/* Edit/Delete Buttons */}
                <div className="absolute top-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => handleEditClick(customer)}
                      className="h-8 sm:h-8 w-8 sm:w-8 p-0 touch-manipulation"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="h-8 sm:h-8 w-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Customer Avatar and Info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getAvatarColor(customer.name)}`}>
                    <span className="font-semibold text-sm">
                      {getInitials(customer.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {customer.name}
                    </h4>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">
                      {customer._count.appointments} ραντεβού
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-600">4.8</span>
                  </div>
                </div>

                {/* Preferences and Notes Preview */}
                {customer.preferences && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Προτιμήσεις:</p>
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {customer.preferences}
                    </p>
                  </div>
                )}

                {customer.notes && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Σημειώσεις:</p>
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {customer.notes}
                    </p>
                  </div>
                )}

                {/* Member Since */}
                <div className="text-xs text-gray-400 mt-2">
                  Μέλος από: {new Date(customer.createdAt).toLocaleDateString('el-GR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Επεξεργασία Πελάτη</DialogTitle>
            <DialogDescription>
              Τροποποιήστε τα στοιχεία του πελάτη
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Όνομα *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="Εισαγάγετε όνομα"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Τηλέφωνο *</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                placeholder="Εισαγάγετε τηλέφωνο"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                placeholder="Εισαγάγετε email (προαιρετικό)"
              />
            </div>
            <div>
              <Label htmlFor="edit-preferences">Προτιμήσεις</Label>
              <Textarea
                id="edit-preferences"
                value={editForm.preferences}
                onChange={(e) => setEditForm({...editForm, preferences: e.target.value})}
                placeholder="Προτιμήσεις πελάτη (π.χ. χρώματα, στυλ, αλλεργίες)"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Σημειώσεις</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                placeholder="Γενικές σημειώσεις για τον πελάτη"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} className="bg-pink-600 hover:bg-pink-700 flex-1">
                Αποθήκευση Αλλαγών
              </Button>
              <Button variant="outline" onClick={() => setEditingCustomer(null)}>
                Ακύρωση
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}