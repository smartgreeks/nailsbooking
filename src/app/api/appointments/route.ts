import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const appointments = await db.appointment.findMany({
      include: {
        customer: true,
        employee: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, employeeId, date, serviceIds, notes } = body

    if (!customerId || !date || !serviceIds || serviceIds.length === 0) {
      return NextResponse.json(
        { error: 'Customer ID, date, and at least one service are required' },
        { status: 400 }
      )
    }

    // Validate employee if provided
    if (employeeId) {
      const employee = await db.employee.findUnique({
        where: { id: employeeId, isActive: true }
      })
      
      if (!employee) {
        return NextResponse.json(
          { error: 'Invalid or inactive employee' },
          { status: 400 }
        )
      }
    }

    // Get services to calculate total duration and price
    const services = await db.service.findMany({
      where: {
        id: {
          in: serviceIds
        }
      }
    })

    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0)
    const totalPrice = services.reduce((sum, service) => sum + service.price, 0)

    // Check employee availability if employee is assigned
    if (employeeId) {
      const appointmentDate = new Date(date)
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      
      // Get employee with working hours and existing appointments
      const employeeWithSchedule = await db.employee.findUnique({
        where: { id: employeeId },
        include: {
          appointments: {
            where: {
              date: {
                gte: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate()),
                lt: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1)
              },
              status: {
                not: 'CANCELLED'
              }
            }
          }
        }
      })

      if (!employeeWithSchedule) {
        return NextResponse.json(
          { error: 'Ο εργαζόμενος δεν βρέθηκε' },
          { status: 400 }
        )
      }

      // Check working hours
      let workingHours = null
      try {
        if (employeeWithSchedule.workingHours) {
          const parsed = JSON.parse(employeeWithSchedule.workingHours)
          workingHours = parsed[dayOfWeek as keyof typeof parsed]
        }
      } catch (error) {
        console.error('Error parsing working hours:', error)
      }

      if (!workingHours || !workingHours.isWorking) {
        return NextResponse.json(
          { error: 'Ο εργαζόμενος δεν εργάζεται αυτή την ημέρα' },
          { status: 400 }
        )
      }

      // Check for time conflicts
      const appointmentStart = appointmentDate.getHours() * 60 + appointmentDate.getMinutes()
      const appointmentEnd = appointmentStart + totalDuration

      const hasConflict = employeeWithSchedule.appointments.some(existingApp => {
        const existingStart = new Date(existingApp.date).getHours() * 60 + new Date(existingApp.date).getMinutes()
        const existingEnd = existingStart + existingApp.totalDuration
        
        // Check if appointments overlap
        return (appointmentStart < existingEnd && appointmentEnd > existingStart)
      })

      if (hasConflict) {
        return NextResponse.json(
          { error: 'Ο εργαζόμενος έχει ήδη ραντεβού αυτή την ώρα' },
          { status: 400 }
        )
      }

      // Check if appointment is within working hours
      const [startHour, startMin] = workingHours.start.split(':').map(Number)
      const [endHour, endMin] = workingHours.end.split(':').map(Number)
      const workStart = startHour * 60 + startMin
      const workEnd = endHour * 60 + endMin

      if (appointmentStart < workStart || appointmentEnd > workEnd) {
        return NextResponse.json(
          { error: 'Το ραντεβού είναι εκτός ωραρίου εργασίας' },
          { status: 400 }
        )
      }
    }

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        customerId,
        employeeId: employeeId || null,
        date: new Date(date),
        notes,
        totalDuration,
        totalPrice,
        services: {
          create: serviceIds.map((serviceId: string) => ({
            serviceId
          }))
        }
      },
      include: {
        customer: true,
        employee: true,
        services: {
          include: {
            service: true
          }
        }
      }
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}