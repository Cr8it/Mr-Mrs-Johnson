import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from 'next/cache';

// Configure timeout limit to match vercel.json
export const maxDuration = 30;

// Helper function to generate a random code
function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Interface for better type safety
interface GuestRecord {
  Name: string;
  Household: string;
  Email?: string;
  DietaryNotes?: string;
  Child?: string;
  Teenager?: string;
}

interface ProcessingResult {
  name: string;
  householdName: string;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  console.log('Starting text import process');
  const startTime = Date.now();
  
  try {
    const { records } = await request.json();

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'No valid records provided' },
        { status: 400 }
      );
    }

    console.log(`Processing ${records.length} records from text import`);

    // Group records by household for more efficient processing
    const households = new Map<string, GuestRecord[]>();
    
    // First pass: group records by household
    for (const record of records) {
      if (!record.Name?.trim() || !record.Household?.trim()) {
        continue; // Skip invalid records
      }
      
      const householdName = record.Household.trim();
      
      if (!households.has(householdName)) {
        households.set(householdName, []);
      }
      
      households.get(householdName)!.push(record);
    }
    
    console.log(`Grouped into ${households.size} households`);
    
    // Process in smaller batches
    const results: ProcessingResult[] = [];
    const errors: string[] = [];
    let processedHouseholds = 0;
    let processedGuests = 0;
    
    // Process each household and its guests
    for (const [householdName, members] of households.entries()) {
      const batchStartTime = Date.now();
      
      try {
        // Find or create the household using findFirst since name isn't unique
        let household = await prisma.household.findFirst({
          where: { 
            name: {
              equals: householdName,
              mode: 'insensitive'
            }
          },
          include: {
            guests: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        // Create the household if it doesn't exist
        if (!household) {
          household = await prisma.household.create({
            data: {
              name: householdName,
              code: generateRandomCode()
            },
            include: {
              guests: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          console.log(`Created new household: ${householdName}`);
        }
        
        processedHouseholds++;
        
        // Get existing guests for duplicate checking
        const existingGuests = new Set(household.guests.map(g => g.name.toLowerCase()));
        
        // Process each guest in the household
        for (const member of members) {
          const guestName = member.Name.trim();
          
          // Skip duplicates
          if (existingGuests.has(guestName.toLowerCase())) {
            results.push({
              name: guestName,
              householdName,
              success: false,
              error: "Duplicate guest"
            });
            continue;
          }
          
          try {
            // Create the guest
            await prisma.guest.create({
              data: {
                name: guestName,
                email: member.Email ? member.Email.trim() : null,
                isChild: member.Child === 'C' || member.Child === 'true' || member.Child === 'YES',
                isTeenager: member.Teenager === 'T' || member.Teenager === 'true' || member.Teenager === 'YES',
                dietaryNotes: member.DietaryNotes || null,
                householdId: household.id
              }
            });
            
            processedGuests++;
            
            results.push({
              name: guestName,
              householdName,
              success: true
            });
          } catch (error) {
            console.error(`Error creating guest ${guestName}:`, error);
            
            results.push({
              name: guestName,
              householdName,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
        }
        
        console.log(`Processed household "${householdName}" with ${members.length} guests in ${Date.now() - batchStartTime}ms`);
      } catch (error) {
        console.error(`Error processing household ${householdName}:`, error);
        
        if (error instanceof Error) {
          errors.push(`Error processing household ${householdName}: ${error.message}`);
        } else {
          errors.push(`Error processing household ${householdName}: Unknown error`);
        }
        
        // Add failure results for all members
        for (const member of members) {
          results.push({
            name: member.Name.trim(),
            householdName,
            success: false,
            error: "Household processing failed"
          });
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`Text import completed in ${totalTime}ms. Created ${processedHouseholds} households and ${processedGuests} guests.`);
    
    // Revalidate the guests page
    revalidatePath('/admin/guests');
    
    // Return response with detailed information
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${processedGuests} guests across ${processedHouseholds} households`,
      processed: {
        households: processedHouseholds,
        guests: processedGuests
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
      processingTime: `${(totalTime/1000).toFixed(2)} seconds`
    });
  } catch (error: any) {
    console.error('Text import error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process import',
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 