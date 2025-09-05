import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse, createValidationErrorResponse } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, notes, preferences } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Check if customer with this phone already exists
    const existingCustomer = await db.customer.findUnique({
      where: { phone }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 409 }
      )
    }

    // Create new customer
    const customer = await db.customer.create({
      data: {
        name,
        phone,
        email,
        notes,
        preferences
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    return createErrorResponse(error, 'Error creating customer')
  }
}