import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const availabilitySchema = z.object({
  serviceId: z.string().optional(),
  date: z.string().refine((date) => {
    return !isNaN(Date.parse(date))
  }, 'Μη έγκυρη ημερομηνία'),
  duration: z.number().min(15).optional() // σε λεπτά
})

// GET /api/employees/availability - Λήψη διαθέσιμων εργαζομένων
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')
    const duration = searchParams.get('duration')

    const validatedData = availabilitySchema.parse({
      serviceId: serviceId || undefined,
      date: date || new Date().toISOString(),
      duration: duration ? parseInt(duration) : undefined
    })

    const targetDate = new Date(validatedData.date)
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof workingDays
    
    const workingDays = {
      'sunday': 'sunday',
      'monday': 'monday', 
      'tuesday': 'tuesday',
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday'
    }

    // Βρίσκουμε όλους τους ενεργούς εργαζομένους
    let whereClause: any = {
      isActive: true
    }

    // Αν έχει δοθεί serviceId, φιλτράρουμε μόνο εργαζομένους που μπορούν να κάνουν αυτή την υπηρεσία
    if (validatedData.serviceId) {
      whereClause.employeeServices = {
        some: {
          serviceId: validatedData.serviceId
        }
      }
    }

    const employees = await db.employee.findMany({
      where: whereClause,
      include: {
        employeeServices: {
          include: {
            service: true
          }
        },
        appointments: {
          where: {
            date: {
              gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
              lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
            },
            status: {
              not: 'CANCELLED'
            }
          },
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      }
    })

    // Υπολογίζουμε τη διαθεσιμότητα για κάθε εργαζόμενο
    const availableEmployees = employees.map(employee => {
      let workingHours = null
      
      try {
        if (employee.workingHours) {
          const parsed = JSON.parse(employee.workingHours)
          workingHours = parsed[dayOfWeek]
        }
      } catch (error) {
        console.error('Error parsing working hours:', error)
      }

      // Αν δεν δουλεύει αυτή την ημέρα
      if (!workingHours || !workingHours.isWorking) {
        return {
          ...employee,
          isAvailable: false,
          availableSlots: [],
          reason: 'Δεν εργάζεται αυτή την ημέρα'
        }
      }

      // Υπολογίζουμε τα διαθέσιμα slots
      const availableSlots = calculateAvailableSlots(
        workingHours,
        employee.appointments,
        validatedData.duration || 60
      )

      return {
        ...employee,
        isAvailable: availableSlots.length > 0,
        availableSlots,
        workingHours: workingHours,
        reason: availableSlots.length === 0 ? 'Δεν υπάρχουν διαθέσιμα ραντεβού' : null
      }
    })

    return NextResponse.json({
      date: validatedData.date,
      serviceId: validatedData.serviceId,
      employees: availableEmployees
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Μη έγκυρα δεδομένα', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching employee availability:', error)
    return NextResponse.json(
      { error: 'Σφάλμα κατά τη λήψη διαθεσιμότητας εργαζομένων' },
      { status: 500 }
    )
  }
}

// Βοηθητική συνάρτηση για υπολογισμό διαθέσιμων slots
function calculateAvailableSlots(
  workingHours: { start: string; end: string; isWorking: boolean },
  appointments: any[],
  duration: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = []
  
  // Μετατροπή ωρών εργασίας σε λεπτά
  const [startHour, startMin] = workingHours.start.split(':').map(Number)
  const [endHour, endMin] = workingHours.end.split(':').map(Number)
  
  const workStart = startHour * 60 + startMin
  const workEnd = endHour * 60 + endMin
  
  // Δημιουργία λίστας κατειλημμένων χρονικών διαστημάτων
  const busySlots = appointments.map(appointment => {
    const appointmentDate = new Date(appointment.date)
    const startMinutes = appointmentDate.getHours() * 60 + appointmentDate.getMinutes()
    return {
      start: startMinutes,
      end: startMinutes + appointment.totalDuration
    }
  }).sort((a, b) => a.start - b.start)
  
  // Βρίσκουμε διαθέσιμα slots
  let currentTime = workStart
  
  for (const busySlot of busySlots) {
    // Αν υπάρχει χώρος πριν από το επόμενο ραντεβού
    if (currentTime + duration <= busySlot.start) {
      // Προσθέτουμε όλα τα δυνατά slots μέχρι το επόμενο ραντεβού
      while (currentTime + duration <= busySlot.start) {
        const slotEnd = currentTime + duration
        slots.push({
          start: formatTime(currentTime),
          end: formatTime(slotEnd)
        })
        currentTime += 30 // slots κάθε 30 λεπτά
      }
    }
    currentTime = Math.max(currentTime, busySlot.end)
  }
  
  // Προσθέτουμε slots μετά το τελευταίο ραντεβού
  while (currentTime + duration <= workEnd) {
    const slotEnd = currentTime + duration
    slots.push({
      start: formatTime(currentTime),
      end: formatTime(slotEnd)
    })
    currentTime += 30
  }
  
  return slots
}

// Βοηθητική συνάρτηση για μετατροπή λεπτών σε ώρα
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}