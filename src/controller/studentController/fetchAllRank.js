import prisma from "../../db/client.js";
import jwt from "jsonwebtoken";

export default async function fetchAllRanks(req, res) {
  try {
    // Verify the JWT token
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.secret);

    // Check if the user has student role
    if (decodedToken.role !== "student") {
      return res.status(403).send({
        status: "failure",
        message: "Access denied. Only students can perform this action.",
      });
    }
    // Fetch all students' exam results
    const studentExams = await prisma.exams.findMany({
      orderBy: {
        exam_name: "asc",
      },
      select: {
        exam_name: true,
        student_id: true,
        students: {
          select: {
            name: true,
          },
        },
        mark1: true,
        mark2: true,
        mark3: true,
      },
    });

    if (!studentExams || studentExams.length === 0) {
      return res.status(404).send({
        status: "failure",
        message: "No student exams found",
      });
    }

    // Calculate ranks within each exam
    const examRankMap = {};
    studentExams.forEach((examResult) => {
      const { exam_name, student_id, students, mark1, mark2, mark3 } =
        examResult;
      const totalMarks = mark1 + mark2 + mark3;

      if (!examRankMap[exam_name]) {
        examRankMap[exam_name] = [];
      }

      examRankMap[exam_name].push({
        user_id: student_id,
        name: students.name,
        totalMarks,
      });
    });

    // Calculate ranks and sort within each exam
    for (const examName in examRankMap) {
      const examResults = examRankMap[examName];
      examResults.sort((a, b) => b.totalMarks - a.totalMarks); // Sort by total marks in descending order
      examResults.forEach((student, index) => {
        student.rank = index + 1;
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Student exam ranks fetched successfully",
      examRanks: examRankMap,
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
