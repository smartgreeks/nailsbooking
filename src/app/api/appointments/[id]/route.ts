import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { customerId, date, serviceIds, employeeId, status, notes } = body

    // Start a transaction to update appointment and services
    const result = await db.$transaction(async (prisma) => {
      // Update the appointment
      const appointment = await prisma.appointment.update({
        where: { id: params.id },
        data: {
          ...(customerId && { customerId }),
          ...(date && { date: new Date(date) }),
          ...(employeeId && { employeeId }),
          ...(status && { status }),
          ...(notes !== undefined && { notes })
        }
      })

      // Update services if provided
      if (serviceIds && Array.isArray(serviceIds)) {
        // Delete existing services
        await prisma.appointmentService.deleteMany({
          where: { appointmentId: params.id }
        })

        // Add new services
        await prisma.appointmentService.createMany({
          data: serviceIds.map((serviceId: string) => ({
            appointmentId: params.id,
            serviceId
          }))
        })

        // Calculate totals
        const services = await prisma.service.findMany({
          where: { id: { in: serviceIds } }
        })

        const totalDuration = services.reduce((sum, service) => sum + service.duration, 0)
        const totalPrice = services.reduce((sum, service) => sum + service.price, 0)

        // Update appointment with totals
        await prisma.appointment.update({
          where: { id: params.id },
          data: {
            totalDuration,
            totalPrice
          }
        })
      }

      // Return updated appointment with relations
      return await prisma.appointment.findUnique({
        where: { id: params.id },
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
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Σφάλμα κατά την ενημέρωση του ραντεβού' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { date, status, notes } = body

    const appointment = await db.appointment.update({
      where: { id: params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes })
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

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete appointment services first
    await db.appointmentService.deleteMany({
      where: { appointmentId: params.id }
    })

    // Then delete the appointment
    await db.appointment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}