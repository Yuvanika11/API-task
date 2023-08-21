import prisma from "../../db/client.js";
import jwt from "jsonwebtoken";

export default async function publishResult(req, res) {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    // Check if the token is present
    if (!token) {
      return res.status(401).send({
        status: "failure",
        message: "Token not provided",
      });
    }

    // Verify the JWT token
    const decodedToken = jwt.verify(token, process.env.secret);

    // Check if the user has admin role
    if (decodedToken.role !== "admin") {
      return res.status(403).send({
        status: "failure",
        message: "Access denied. Only admins can perform this action.",
      });
    }

    const examResults = await prisma.exams.findMany({
      select: {
        exam_name: true,
        mark1: true,
        mark2: true,
        mark3: true,
        students: {
          select: {
            users: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    const examRankMap = {}; // Object to store aggregated results

    for (const examResult of examResults) {
      const { exam_name, mark1, mark2, mark3, students } = examResult;
      const { users } = students;

      if (!examRankMap[exam_name]) {
        examRankMap[exam_name] = [];
      }

      const totalMarks = mark1 + mark2 + mark3; // Calculate total marks
      examRankMap[exam_name].push({
        user_id: users.id,
        total: totalMarks, // Assign the calculated total marks
        username: users.username, // Include username
        examDetails: { mark1, mark2, mark3 },
      });
    }

    // Calculate rank within each exam
    for (const examName in examRankMap) {
      const examResults = examRankMap[examName];
      examResults.sort((a, b) => b.total - a.total); // Sort by total marks in descending order
      examResults.forEach((student, index) => {
        student.rank = index + 1;
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Exam results published successfully",
      examResults: examRankMap,
    });
  } catch (error) {
    console.error("Error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send({
        status: "failure",
        message: "Invalid token",
      });
    }
    console.error("Error:", error);
    return res.status(500).send({
      status: "failure",
      message: "Internal Server Error",
    });
  }
}
