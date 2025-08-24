import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const appointments = await db.appointment.findMany({
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
    const { customerId, date, serviceIds, notes } = body

    if (!customerId || !date || !serviceIds || serviceIds.length === 0) {
      return NextResponse.json(
        { error: 'Customer ID, date, and at least one service are required' },
        { status: 400 }
      )
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

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        customerId,
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