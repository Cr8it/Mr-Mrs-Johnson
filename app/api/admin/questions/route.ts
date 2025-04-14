import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: {
        order: 'asc'
      }
    })
    return NextResponse.json(questions)
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Received request body:", JSON.stringify(body).substring(0, 500) + "...")
    
    // Function to safely prepare options for storage
    const prepareOptions = (questionType: string, optionsData: any): string => {
      try {
        if (questionType === 'MULTIPLE_CHOICE' || questionType === 'MULTIPLE_SELECT') {
          // Ensure we have an array of strings
          const options = Array.isArray(optionsData) 
            ? optionsData.filter(opt => opt && typeof opt === 'string') 
            : [];
            
          // Stringify the array safely
          return JSON.stringify(options);
        }
        return '';
      } catch (error) {
        console.error("Error preparing options:", error);
        // Return empty array as fallback
        return '[]';
      }
    };
    
    // Check if the body is an array (bulk update) or a single question
    if (Array.isArray(body)) {
      // Handle bulk update (delete all existing questions and create new ones)
      console.log(`Bulk update with ${body.length} questions`);
      
      try {
        // First delete all existing questions
        await prisma.questionResponse.deleteMany();
        await prisma.question.deleteMany();
        
        // Then create all questions one by one, not in a transaction
        // This is more robust if there's an issue with one question
        const createdQuestions = [];
        
        for (const question of body) {
          try {
            console.log(`Processing question: ${question.question}, type: ${question.type}`);
            
            const options = prepareOptions(question.type, question.options);
            console.log(`Prepared options: ${options}`);
            
            const created = await prisma.question.create({
              data: {
                question: question.question || '',
                type: question.type || 'TEXT',
                options: options,
                isRequired: Boolean(question.isRequired),
                isActive: Boolean(question.isActive !== false), // default to true
                order: Number(question.order || 0),
                perGuest: Boolean(question.perGuest)
              }
            });
            
            createdQuestions.push(created);
          } catch (questionError) {
            console.error(`Error creating question ${question.question}:`, questionError);
            // Continue with other questions instead of failing completely
          }
        }
        
        return NextResponse.json(createdQuestions);
      } catch (bulkError) {
        console.error("Error in bulk update:", bulkError);
        throw bulkError;
      }
    } else {
      // Handle single question creation
      const question = body;
      console.log(`Single question creation: ${question.question}, type: ${question.type}`);
      
      const options = prepareOptions(question.type, question.options);
      console.log(`Prepared options: ${options}`);
      
      const createdQuestion = await prisma.question.create({
        data: {
          question: question.question || '',
          type: question.type || 'TEXT',
          options: options,
          isRequired: Boolean(question.isRequired),
          isActive: Boolean(question.isActive !== false), // default to true
          order: Number(question.order || 0),
          perGuest: Boolean(question.perGuest)
        }
      });
      
      return NextResponse.json(createdQuestion);
    }
  } catch (error: any) {
    console.error("Error saving question(s):", error);
    console.error("Error details:", { 
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    
    // Format a more helpful error message
    let errorMessage = "Failed to save questions";
    if (error.code === 'P2002') {
      errorMessage = "A question with this information already exists";
    } else if (error.code === 'P2009') {
      errorMessage = "Invalid data format for question";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: "Failed to save question(s)",
        message: errorMessage,
        code: error.code
      },
      { status: 500 }
    );
  }
}

