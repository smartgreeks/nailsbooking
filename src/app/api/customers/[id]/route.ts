import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse, createValidationErrorResponse, createSuccessResponse, ValidationPatterns } from '@/lib/api-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, phone, email, notes, preferences } = body

    if (!name || !phone) {
      return createValidationErrorResponse('Name and phone are required')
    }

    // Check if another customer with this phone already exists
    const existingCustomer = await db.customer.findFirst({
      where: {
        phone,
        id: { not: params.id }
      }
    })

    if (existingCustomer) {
      return createValidationErrorResponse('Another customer with this phone number already exists', 409)
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
    return createErrorResponse(error, 'Error updating customer')
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
      return createValidationErrorResponse('Cannot delete customer with existing appointments')
    }

    await db.customer.delete({
      where: { id: params.id }
    })

    return createSuccessResponse()
  } catch (error) {
    return createErrorResponse(error, 'Error deleting customer')
  }
}