import { NextResponse } from 'next/server'

/**
 * Standardized error response handler for API routes
 */
export function createErrorResponse(error: unknown, message?: string) {
  console.error('API Error:', error)
  
  return NextResponse.json(
    { error: message || 'Internal server error' },
    { status: 500 }
  )
}

/**
 * Standardized validation error response
 */
export function createValidationErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

/**
 * Standardized success response
 */
export function createSuccessResponse(data?: any, status: number = 200) {
  return NextResponse.json(data || { success: true }, { status })
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  required: (field: string) => `${field} is required`,
  email: 'Invalid email format',
  phone: 'Invalid phone format',
  duplicate: (field: string) => `${field} already exists`
}