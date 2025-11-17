import { NextRequest, NextResponse } from 'next/server';

interface AuthAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const attempts: { [key: string]: AuthAttempt } = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

export function checkBruteForce(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempt = attempts[identifier];
  
  if (!attempt) {
    attempts[identifier] = { count: 0, lastAttempt: now };
    return { allowed: true };
  }
  
  // Check if still locked
  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((attempt.lockedUntil - now) / 1000) 
    };
  }
  
  // Reset if attempt window expired
  if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
    attempt.count = 0;
    attempt.lockedUntil = undefined;
  }
  
  return { allowed: true };
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  
  if (!attempts[identifier]) {
    attempts[identifier] = { count: 1, lastAttempt: now };
  } else {
    attempts[identifier].count++;
    attempts[identifier].lastAttempt = now;
  }
  
  // Lock if max attempts reached
  if (attempts[identifier].count >= MAX_ATTEMPTS) {
    attempts[identifier].lockedUntil = now + LOCKOUT_DURATION;
  }
}

export function recordSuccessfulAttempt(identifier: string): void {
  if (attempts[identifier]) {
    delete attempts[identifier];
  }
}

export function withAuthProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const bruteForceCheck = checkBruteForce(ip);
    
    if (!bruteForceCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': bruteForceCheck.retryAfter?.toString() || '900'
          }
        }
      );
    }
    
    try {
      const response = await handler(req);
      
      // Record successful attempt if auth succeeded
      if (response.status === 200) {
        recordSuccessfulAttempt(ip);
      } else if (response.status === 401 || response.status === 403) {
        recordFailedAttempt(ip);
      }
      
      return response;
    } catch (error) {
      recordFailedAttempt(ip);
      throw error;
    }
  };
}