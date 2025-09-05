import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Το όνομα είναι υποχρεωτικό'),
  email: z.string().email('Μη έγκυρο email').optional().nullable(),
  phone: z.string().optional().nullable(),
  specialties: z.array(z.string()).optional(),
  workingHours: z.object({
    monday: z.object({ start: z.string(), end: z.string(), isWorking: z.boolean() }).optional(),
    tuesday: z.object({ start: z.string(), end: z.string(), isWorking: z.boolean() }).optional(),
    wednesday: z.object({ start: z.string(), end: z.string(), isWorking: z.boolean() }).optional(),
    thursday: z.object({ start: z.string(), end: z.string(), isWorking: z.boolean() }).optional(),
    friday: z.object({ start: z.string(), end: z.string(), isWorking: z.boolean() }).optional(),
    saturday: z.object({ start: z.string(), end: z.string(), isWorking: z.boolean() }).optional(),
    sunday: z.object({ start: z.string(), end: z.string(), isWorking: z.boolean() }).optional(),
  }).optional(),
  isActive: z.boolean().default(true)
})

// GET /api/employees - Λήψη όλων των εργαζομένων
export async function GET() {
  try {
    const employees = await db.employee.findMany({
      include: {
        employeeServices: {
          include: {
            service: true
          }
        },
        _count: {
          select: {
            appointments: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Σφάλμα κατά τη λήψη των εργαζομένων' },
      { status: 500 }
    )
  }
}

// POST /api/employees - Δημιουργία νέου εργαζομένου
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createEmployeeSchema.parse(body)

    const employee = await db.employee.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        specialties: validatedData.specialties ? JSON.stringify(validatedData.specialties) : null,
        workingHours: validatedData.workingHours ? JSON.stringify(validatedData.workingHours) : null,
        isActive: validatedData.isActive
      },
      include: {
        employeeServices: {
          include: {
            service: true
          }
        }
      }
    })

    // Αν υπάρχουν specialties, δημιουργούμε τις σχέσεις EmployeeService
    if (validatedData.specialties && validatedData.specialties.length > 0) {
      await db.employeeService.createMany({
        data: validatedData.specialties.map(serviceId => ({
          employeeId: employee.id,
          serviceId: serviceId
        }))
      })
    }

    // Επιστρέφουμε τον εργαζόμενο με τις υπηρεσίες του
    const employeeWithServices = await db.employee.findUnique({
      where: { id: employee.id },
      include: {
        employeeServices: {
          include: {
            service: true
          }
        }
      }
    })

    return NextResponse.json(employeeWithServices, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Μη έγκυρα δεδομένα', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Σφάλμα κατά τη δημιουργία του εργαζομένου' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees - Διαγραφή όλων των εργαζομένων (για testing)
export async function DELETE() {
  try {
    await db.employeeService.deleteMany()
    await db.employee.deleteMany()
    
    return NextResponse.json({ message: 'Όλοι οι εργαζόμενοι διαγράφηκαν επιτυχώς' })
  } catch (error) {
    console.error('Error deleting employees:', error)
    return NextResponse.json(
      { error: 'Σφάλμα κατά τη διαγραφή των εργαζομένων' },
      { status: 500 }
    )
  }
}