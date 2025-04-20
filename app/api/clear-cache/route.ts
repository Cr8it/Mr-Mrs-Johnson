import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API route to clear caches throughout the application
 * Visit /api/clear-cache to force a refresh of all application data
 */
export async function GET(request: Request) {
  try {
    // Get all paths we should revalidate
    const pathsToRevalidate = [
      '/',
      '/rsvp',
      '/admin',
      '/admin/menu-options',
      '/api/rsvp/options',
      '/api/rsvp/form-data',
      '/api/admin/meal-options',
      '/api/admin/dessert-options'
    ];
    
    // Revalidate each path to clear Next.js cache
    for (const path of pathsToRevalidate) {
      revalidatePath(path);
      console.log(`Revalidated: ${path}`);
    }

    // Return success with cache control headers to prevent browser caching
    return new Response(
      JSON.stringify({
        success: true,
        message: "All caches cleared successfully!",
        timestamp: new Date().toISOString(),
        revalidatedPaths: pathsToRevalidate
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Surrogate-Control': 'no-store',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error("Error clearing cache:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to clear cache",
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
} 