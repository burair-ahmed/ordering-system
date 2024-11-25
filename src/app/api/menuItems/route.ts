import { NextResponse } from 'next/server';

// POST method to handle form submission
export async function POST(request: Request) {
  try {
    const data = await request.json();  // Parse the incoming JSON data
    console.log(data);  // Log the received data (you can remove this later)

    // Here, you can process and store the data in your database

    // Send a success response
    return NextResponse.json({ message: 'Menu item added successfully!' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add menu item' }, { status: 500 });
  }
}
