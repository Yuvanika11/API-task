import prisma from "../../db/client.js";
import jwt from "jsonwebtoken";

export default async function fetchAll(req, res) {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;

    // Check if the token is present
    if (!authHeader) {
      return res.status(401).send({
        status: "failure",
        message: "Token not provided",
      });
    }

    // Extract the token from the "Bearer <token>" format
    const token = authHeader.split(" ")[1];

    // Verify the JWT token
    const decodedToken = jwt.verify(token, process.env.secret);

    // Check if the user has admin role
    if (decodedToken.role !== "admin") {
      return res.status(403).send({
        status: "failure",
        message: "Access denied. Only admins can perform this action.",
      });
    }

    // Fetch students with their related exam records
    const studentsWithExams = await prisma.students.findMany({
      include: {
        users: true,
        exams: true,
      },
    });

    // Transform the data to include username, id, total, and rank in each exam
    const transformedData = studentsWithExams.map((student) => {
      const { user_id, name, exams } = student;
      const examsWithDetails = exams.map((exam) => {
        const { mark1, mark2, mark3 } = exam;
        const total = mark1 + mark2 + mark3; // Calculate total
        return {
          exam_name: exam.exam_name,
          mark1,
          mark2,
          mark3,
          total,
          rank: exam.rank, // Use the rank from the exam record
        };
      });
      return {
        user_id,
        username: name,
        exams: examsWithDetails,
      };
    });

    return res.status(200).send({
      data: transformedData,
    });
  } catch (error) {
    console.error("Error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send({
        status: "failure",
        message: "Invalid token",
      });
    }
    return res.status(500).send({
      status: "failure",
      message: "Internal Server Error",
    });
  }
}
