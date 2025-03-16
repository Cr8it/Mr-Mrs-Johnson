export default {
  name: "rsvp",
  title: "RSVP",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
    },
    {
      name: "email",
      title: "Email",
      type: "string",
    },
    {
      name: "attending",
      title: "Attending",
      type: "string",
    },
    {
      name: "meal",
      title: "Meal Preference",
      type: "reference",
      to: [{ type: "mealOption" }],
    },
    {
      name: "dietary",
      title: "Dietary Restrictions",
      type: "text",
    },
    {
      name: "submittedAt",
      title: "Submitted At",
      type: "datetime",
    },
  ],
}

