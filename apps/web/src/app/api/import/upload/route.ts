import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for file upload to Fastify API
 *
 * This route forwards multipart form data to the Fastify API
 * while adding authentication headers from Clerk.
 */

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in to upload files' },
      { status: 401 }
    );
  }

  try {
    // Get the form data from the request
    const formData = await request.formData();

    // Forward to Fastify API
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/import/upload`, {
      method: 'POST',
      headers: {
        // Forward Clerk authentication
        'x-clerk-user-id': userId,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Upload proxy error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to upload file. Please try again.',
      },
      { status: 500 }
    );
  }
}
