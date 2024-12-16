import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Trigger the socket route once during the request lifecycle
  if (req.nextUrl.pathname === '/api/socket') {
    fetch(`${req.nextUrl.origin}/api/socket`)
      .then(() => console.log('WebSocket server initialized'))
      .catch((err) => console.error('Failed to initialize WebSocket server:', err));
  }

  return NextResponse.next();
}
