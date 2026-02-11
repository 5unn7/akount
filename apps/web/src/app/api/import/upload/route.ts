import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for file upload to Fastify API
 *
 * Forwards multipart form data to the correct Fastify endpoint
 * (CSV or PDF) with Bearer token authentication from Clerk.
 */
export async function POST(request: NextRequest) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in to upload files' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No file provided' },
        { status: 400 }
      );
    }

    // Determine backend endpoint based on file extension
    const fileName = file.name.toLowerCase();
    let endpoint: string;
    if (fileName.endsWith('.pdf')) {
      endpoint = '/api/banking/imports/pdf';
    } else if (fileName.endsWith('.csv')) {
      endpoint = '/api/banking/imports/csv';
    } else {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Unsupported file type. Use CSV or PDF.' },
        { status: 400 }
      );
    }

    // Build backend form data
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    // Forward accountId and optional fields
    const accountId = formData.get('accountId');
    if (accountId) backendFormData.append('accountId', accountId as string);

    const dateFormat = formData.get('dateFormat');
    if (dateFormat) backendFormData.append('dateFormat', dateFormat as string);

    const columnMappings = formData.get('columnMappings');
    if (columnMappings) backendFormData.append('columnMappings', columnMappings as string);

    // Forward to Fastify API with Bearer token
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
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
