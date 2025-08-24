import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, phone, email, notes, preferences } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Check if another customer with this phone already exists
    const existingCustomer = await db.customer.findFirst({
      where: {
        phone,
        id: { not: params.id }
      }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Another customer with this phone number already exists' },
        { status: 409 }
      )
    }

    const customer = await db.customer.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        email,
        notes,
        preferences
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
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
    // Check if customer has appointments
    const appointmentsCount = await db.appointment.count({
      where: { customerId: params.id }
    })

    if (appointmentsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with existing appointments' },
        { status: 400 }
      )
    }

    await db.customer.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}