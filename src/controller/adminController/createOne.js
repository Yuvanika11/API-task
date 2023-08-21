import prisma from "../../db/client.js";
import jwt from "jsonwebtoken";

export default async function createExams(req, res) {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;

    // Extract the token from the "Bearer <token>" format
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
    const { user_id, user_name, password, exams } = req.body;
    // Create the student's user record with the provided password
    const user = await prisma.users.create({
      data: {
        username: user_name,
        password: password,
        id: user_id,
        role: "student",
      },
    });

    // Create the student's record
    const student = await prisma.students.create({
      data: {
        user_id: user.id,
        name: user.username,
      },
    });

    // Create exam records and calculate total for each exam
    const createdExams = await Promise.all(
      exams.map(async (exams) => {
        const examData = {
          student_id: student.user_id,
          exam_name: exams.exam_name,
          mark1: exams.mark1,
          mark2: exams.mark2,
          mark3: exams.mark3,
        };
        const total = exams.mark1 + exams.mark2 + exams.mark3;
        return prisma.exams.create({
          data: { ...examData, total },
        });
      })
    );

    return res.status(200).send({
      status: "success",
      message: "Record created successfully",
      data: createdExams.map((exams) => ({
        student_id: exams.student_id,
        exam_name: exams.exam_name,
        mark1: exams.mark1,
        mark2: exams.mark2,
        mark3: exams.mark3,
        total: exams.total,
      })),
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
