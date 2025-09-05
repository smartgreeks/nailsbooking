import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createErrorResponse } from '@/lib/api-utils'

export async function GET() {
  try {
    const services = await db.service.findMany({
      where: {
        isactive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    return createErrorResponse(error, 'Error fetching services')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, duration, price, isactive } = body

    if (!name || !duration || !price) {
      return NextResponse.json(
        { error: 'Name, duration, and price are required' },
        { status: 400 }
      )
    }

    const service = await db.service.create({
      data: {
        name,
        description,
        duration,
        price,
        isactive
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    return createErrorResponse(error, 'Error creating service')
  }
}
