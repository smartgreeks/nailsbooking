import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, duration, price, isactive } = body

    const service = await db.service.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(duration && { duration }),
        ...(price && { price }),
        ...(isactive !== undefined && { isactive })
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    return createErrorResponse(error, 'Error updating service')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.service.delete({
      where: { id: params.id }
    })

    return createSuccessResponse()
  } catch (error) {
    return createErrorResponse(error, 'Error deleting service')
  }
}
