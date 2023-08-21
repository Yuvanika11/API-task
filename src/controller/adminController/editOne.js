import prisma from "../../db/client.js";
import jwt from "jsonwebtoken";

export default async function editExams(req, res) {
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

    // Check if user with given user_id exists
    const existingUser = await prisma.users.findUnique({
      where: { id: user_id },
    });

    if (!existingUser) {
      return res.status(404).send({
        status: "failure",
        message: "User not found",
      });
    }

    // Update user record if fields are provided
    if (user_name || password) {
      await prisma.users.update({
        where: { id: user_id },
        data: {
          username: user_name || existingUser.username,
          password: password || existingUser.password,
        },
      });
    }

    // Update student record if fields are provided
    if (user_name) {
      await prisma.students.update({
        where: { user_id: user_id },
        data: {
          name: user_name,
        },
      });
    }

    // Update exam records if fields are provided
    if (exams && exams.length > 0) {
      await Promise.all(
        exams.map(async (exams) => {
          const existingExam = await prisma.exams.findUnique({
            where: { id: exams.id },
          });

          if (existingExam) {
            const updatedExamData = {
              exam_name: exams.exam_name || existingExam.exams_name,
              mark1: exams.mark1 || existingExam.mark1,
              mark2: exams.mark2 || existingExam.mark2,
              mark3: exams.mark3 || existingExam.mark3,
            };

            const total =
              updatedExamData.mark1 +
              updatedExamData.mark2 +
              updatedExamData.mark3;

            await prisma.exams.update({
              where: { id: exams.id },
              data: { ...updatedExamData, total },
            });
          }
        })
      );
    }

    return res.status(200).send({
      status: "success",
      message: "Record updated successfully",
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
