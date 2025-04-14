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
    console.log("Request received to /api/admin/questions");
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    // Helper function to safely process options
    const getOptionsString = (question: any) => {
      try {
        if (question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTIPLE_SELECT') {
          if (Array.isArray(question.options)) {
            return JSON.stringify(question.options.filter(Boolean));
          } else if (typeof question.options === 'string') {
            // If already a string, check if it's JSON
            if (question.options.trim().startsWith('[')) {
              // Validate that it's proper JSON
              JSON.parse(question.options);
              return question.options;
            } else {
              // Convert comma-separated string to array
              return JSON.stringify(question.options.split(',').map(o => o.trim()).filter(Boolean));
            }
          } else {
            // Default to empty array
            return '[]';
          }
        } else {
          return '';
        }
      } catch (error) {
        console.error("Error processing options for question:", question.question, error);
        return '[]'; // Return empty array as fallback
      }
    };
    
    // Check if the body is an array (bulk update) or a single question
    if (Array.isArray(body)) {
      console.log("Processing array of questions, length:", body.length);
      // Handle bulk update (delete all existing questions and create new ones)
      await prisma.question.deleteMany();
      
      // Create all questions in a transaction
      const createdQuestions = await prisma.$transaction(
        body.map((question: any) => {
          console.log("Processing question:", question.question, "type:", question.type);
          
          // Safely handle options
          const optionsValue = getOptionsString(question);
          console.log("Options value:", optionsValue);
          
          return prisma.question.create({
            data: {
              question: question.question || '',
              type: question.type || 'TEXT',
              options: optionsValue,
              isRequired: !!question.isRequired,
              isActive: question.isActive === false ? false : true,
              order: typeof question.order === 'number' ? question.order : 0,
              perGuest: !!question.perGuest
            }
          });
        })
      );
      
      console.log("Created questions:", createdQuestions.length);
      return NextResponse.json(createdQuestions);
    } else {
      // Handle single question creation
      console.log("Processing single question");
      const question = body;
      
      // Log the question fields
      console.log("Question:", question.question);
      console.log("Type:", question.type);
      console.log("Options:", question.options);
      
      // Safely handle options
      const optionsValue = getOptionsString(question);
      console.log("Options value for storage:", optionsValue);
      
      const createdQuestion = await prisma.question.create({
        data: {
          question: question.question || '',
          type: question.type || 'TEXT',
          options: optionsValue,
          isRequired: !!question.isRequired,
          isActive: question.isActive === false ? false : true,
          order: typeof question.order === 'number' ? question.order : 0,
          perGuest: !!question.perGuest
        }
      });
      
      console.log("Question created successfully:", createdQuestion.id);
      return NextResponse.json(createdQuestion);
    }
  } catch (error) {
    console.error("Error saving question(s):", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to save question(s)",
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

