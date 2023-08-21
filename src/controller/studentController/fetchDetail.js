import prisma from "../../db/client.js";
import jwt from "jsonwebtoken";

export default async function fetchStudentDetail(req, res) {
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
  const { user_id } = req.params;

  try {
    // Fetch student details based on user_id
    const studentDetail = await prisma.students.findUnique({
      where: {
        id: parseInt(user_id),
      },
      include: {
        exams: {
          select: {
            exam_name: true,
            mark1: true,
            mark2: true,
            mark3: true,
          },
        },
      },
    });

    if (!studentDetail) {
      return res.status(404).send({
        status: "failure",
        message: "Student not found",
      });
    }

    // Calculate total marks and ranks for each exam
    const sortedExams = studentDetail.exams
      .map((exam) => {
        const total = exam.mark1 + exam.mark2 + exam.mark3;
        return { ...exam, total };
      })
      .sort((a, b) => b.total - a.total);

    sortedExams.forEach((exam, index) => {
      exam.rank = index + 1;
    });

    return res.status(200).send({
      status: "success",
      message: "Student details fetched successfully",
      studentDetail: {
        user_id: studentDetail.id,
        name: studentDetail.name,
        exams: sortedExams.map((exam) => ({
          exam_name: exam.exam_name,
          mark1: exam.mark1,
          mark2: exam.mark2,
          mark3: exam.mark3,
          total: exam.total,
        })),
      },
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
