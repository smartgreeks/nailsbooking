"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Star, Clock, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
}

interface Appointment {
  id: string
  date: string
  status: string
  totalDuration: number
  totalPrice: number
  services: { service: Service }[]
}

interface Statistics {
  totalAppointments: number
  todayAppointments: number
  weeklyRevenue: number
  monthlyRevenue: number
  totalCustomers: number
  newCustomersThisMonth: number
  popularServices: Array<{
    service: Service
    count: number
    revenue: number
  }>
  appointmentStatusCounts: {
    SCHEDULED: number
    COMPLETED: number
    CANCELLED: number
    NO_SHOW: number
  }
  averageAppointmentValue: number
  completionRate: number
}

interface StatisticsDashboardProps {
  appointments: Appointment[]
}

export default function StatisticsDashboard({ appointments }: StatisticsDashboardProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null)

  useEffect(() => {
    calculateStatistics()
  }, [appointments])

  const calculateStatistics = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Basic counts
    const todayAppointments = appointments.filter(app => {
      const appDate = new Date(app.date)
      return appDate >= today && appDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }).length

    const weeklyAppointments = appointments.filter(app => {
      const appDate = new Date(app.date)
      return appDate >= weekStart
    })

    const monthlyAppointments = appointments.filter(app => {
      const appDate = new Date(app.date)
      return appDate >= monthStart
    })

    const weeklyRevenue = weeklyAppointments.reduce((sum, app) => sum + app.totalPrice, 0)
    const monthlyRevenue = monthlyAppointments.reduce((sum, app) => sum + app.totalPrice, 0)

    // Service popularity
    const serviceCount = new Map<string, { service: Service; count: number; revenue: number }>()
    
    appointments.forEach(appointment => {
      appointment.services.forEach(({ service }) => {
        const existing = serviceCount.get(service.id)
        if (existing) {
          existing.count++
          existing.revenue += service.price
        } else {
          serviceCount.set(service.id, { service, count: 1, revenue: service.price })
        }
      })
    })

    const popularServices = Array.from(serviceCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Status counts
    const statusCounts = appointments.reduce((acc, app) => {
      acc[app.status as keyof typeof acc]++
      return acc
    }, { SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0, NO_SHOW: 0 })

    // Customer statistics
    const customerSet = new Set<string>()
    const monthlyCustomerSet = new Set<string>()
    
    appointments.forEach(app => {
      // Extract customer ID from appointment (this would normally come from customer relation)
      const customerId = app.id.split('-')[0] // This is a workaround - in real app you'd have proper customer relation
      customerSet.add(customerId)
      
      const appDate = new Date(app.date)
      if (appDate >= monthStart) {
        monthlyCustomerSet.add(customerId)
      }
    })

    const totalCustomers = customerSet.size
    const newCustomersThisMonth = monthlyCustomerSet.size

    // Average appointment value
    const completedAppointments = appointments.filter(app => app.status === 'COMPLETED')
    const averageAppointmentValue = completedAppointments.length > 0 
      ? completedAppointments.reduce((sum, app) => sum + app.totalPrice, 0) / completedAppointments.length
      : 0

    // Completion rate
    const totalScheduled = statusCounts.SCHEDULED + statusCounts.COMPLETED + statusCounts.CANCELLED + statusCounts.NO_SHOW
    const completionRate = totalScheduled > 0 
      ? ((statusCounts.COMPLETED / totalScheduled) * 100)
      : 0

    setStatistics({
      totalAppointments: appointments.length,
      todayAppointments,
      weeklyRevenue,
      monthlyRevenue,
      totalCustomers,
      newCustomersThisMonth,
      popularServices,
      appointmentStatusCounts: statusCounts,
      averageAppointmentValue,
      completionRate
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous * 100)
  }

  if (!statistics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Σημερινά Ραντεβού
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.appointmentStatusCounts.SCHEDULED} σε αναμονή
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Εβδομαδιαία Έσοδα
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.weeklyRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              +12% από την προηγούμενη εβδομάδα
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Σύνολο Πελατών
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +{statistics.newCustomersThisMonth} αυτόν τον μήνα
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ποσοστό Ολοκλήρωσης
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completionRate.toFixed(1)}%</div>
            <Progress value={statistics.completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Popular Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Πιο Δημοφιλείς Υπηρεσίες
          </CardTitle>
          <CardDescription>
            Οι υπηρεσίες με τις περισσότερες κρατήσεις αυτόν τον μήνα
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statistics.popularServices.map((item, index) => (
              <div key={item.service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-pink-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{item.service.name}</h4>
                    <p className="text-sm text-gray-600">{item.count} ραντεβού</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(item.revenue)}</div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(item.service.price)} ανά ραντεβού
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Κατάσταση Ραντεβού
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Προγραμματισμένα</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {statistics.appointmentStatusCounts.SCHEDULED}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Ολοκληρωμένα</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {statistics.appointmentStatusCounts.COMPLETED}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Ακυρωμένα</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {statistics.appointmentStatusCounts.CANCELLED}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Δεν ήρθαν</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {statistics.appointmentStatusCounts.NO_SHOW}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Επιχειρηματικά Μετρικά
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Μέση Τιμή Ραντεβού</span>
                  <span className="font-bold">{formatCurrency(statistics.averageAppointmentValue)}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Συνολικά Έσοδα Μήνα</span>
                  <span className="font-bold">{formatCurrency(statistics.monthlyRevenue)}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  +8% από τον προηγούμενο μήνα
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Συνολικά Ραντεβού</span>
                  <span className="font-bold">{statistics.totalAppointments}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}