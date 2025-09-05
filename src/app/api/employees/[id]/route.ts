import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateEmployeeSchema = z.object({
  name: z.string().min(1, 'Το όνομα είναι υποχρεωτικό').optional(),
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
  isActive: z.boolean().optional()
})

// GET /api/employees/[id] - Λήψη συγκεκριμένου εργαζομένου
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await db.employee.findUnique({
      where: {
        id: params.id
      },
      include: {
        employeeServices: {
          include: {
            service: true
          }
        },
        appointments: {
          include: {
            customer: true,
            services: {
              include: {
                service: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Ο εργαζόμενος δεν βρέθηκε' },
        { status: 404 }
      )
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { error: 'Σφάλμα κατά τη λήψη του εργαζομένου' },
      { status: 500 }
    )
  }
}

// PUT /api/employees/[id] - Ενημέρωση εργαζομένου
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateEmployeeSchema.parse(body)

    // Έλεγχος αν ο εργαζόμενος υπάρχει
    const existingEmployee = await db.employee.findUnique({
      where: { id: params.id }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Ο εργαζόμενος δεν βρέθηκε' },
        { status: 404 }
      )
    }

    // Ενημέρωση του εργαζομένου
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.email !== undefined) updateData.email = validatedData.email
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.specialties !== undefined) {
      updateData.specialties = JSON.stringify(validatedData.specialties)
    }
    if (validatedData.workingHours !== undefined) {
      updateData.workingHours = JSON.stringify(validatedData.workingHours)
    }

    const employee = await db.employee.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employeeServices: {
          include: {
            service: true
          }
        }
      }
    })

    // Ενημέρωση των specialties αν χρειάζεται
    if (validatedData.specialties !== undefined) {
      // Διαγραφή των παλιών σχέσεων
      await db.employeeService.deleteMany({
        where: { employeeId: params.id }
      })

      // Δημιουργία των νέων σχέσεων
      if (validatedData.specialties.length > 0) {
        await db.employeeService.createMany({
          data: validatedData.specialties.map(serviceId => ({
            employeeId: params.id,
            serviceId: serviceId
          }))
        })
      }
    }

    // Επιστροφή του ενημερωμένου εργαζομένου
    const updatedEmployee = await db.employee.findUnique({
      where: { id: params.id },
      include: {
        employeeServices: {
          include: {
            service: true
          }
        }
      }
    })

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Μη έγκυρα δεδομένα', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Σφάλμα κατά την ενημέρωση του εργαζομένου' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees/[id] - Διαγραφή εργαζομένου
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Έλεγχος αν ο εργαζόμενος υπάρχει
    const existingEmployee = await db.employee.findUnique({
      where: { id: params.id }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Ο εργαζόμενος δεν βρέθηκε' },
        { status: 404 }
      )
    }

    // Διαγραφή του εργαζομένου (οι σχέσεις θα διαγραφούν αυτόματα λόγω cascade)
    await db.employee.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Ο εργαζόμενος διαγράφηκε επιτυχώς' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Σφάλμα κατά τη διαγραφή του εργαζομένου' },
      { status: 500 }
    )
  }
}