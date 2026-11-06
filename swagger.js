import swaggerJsdoc from "swagger-jsdoc";

const serverUrl = process.env.API_BASE_URL || "/";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Product Management API",
      version: "1.0.0",
      description: "Documentation for the product API",
    },
    servers: [
      {
        url: serverUrl,
        description: process.env.API_BASE_URL ? "Configured API server" : "Current server",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;