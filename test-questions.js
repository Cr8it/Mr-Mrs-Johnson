// Add a debug logging in QuestionManager.tsx
function debugSubmit() {
  const data = {
    question: "Test Question",
    type: "MULTIPLE_SELECT",
    options: ["Option 1", "Option 2"],
    isRequired: false,
    perGuest: false,
    isActive: true,
    order: 0
  };

  console.log("Request Data:", JSON.stringify(data, null, 2));
  
  fetch("/api/admin/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
  })
  .then(result => {
    console.log("Success:", result);
  })
  .catch(error => {
    console.error("Error:", error);
  });
}

// Call this function from browser console to test 