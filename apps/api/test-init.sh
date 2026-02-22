#!/bin/bash
# Test the /initialize endpoint with a mock payload
curl -X POST http://localhost:4000/api/system/onboarding/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-will-fail" \
  -d '{
    "accountType": "personal",
    "entityName": "Test User",
    "entityType": "PERSONAL",
    "timezone": "America/Toronto",
    "country": "CA",
    "currency": "CAD",
    "intents": ["track_expenses"],
    "employmentStatus": "employed",
    "streetAddress": "123 Test St",
    "city": "Toronto",
    "province": "ON",
    "postalCode": "M5V1A1"
  }' 2>&1
