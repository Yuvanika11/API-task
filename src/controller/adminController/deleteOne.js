import prisma from "../../db/client.js";
import jwt from "jsonwebtoken"; // Don't forget to import jwt

export default async function deleteOne(req, res) {
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

  try {
    // Verify the JWT token
    const decodedToken = jwt.verify(token, process.env.secret);

    // Check if the user has admin role
    if (decodedToken.role !== "admin") {
      return res.status(403).send({
        status: "failure",
        message: "Access denied. Only admins can perform this action.",
      });
    }

    const { user_id } = req.params;

    // Fetch the student record based on user_id
    const student = await prisma.students.findFirst({
      where: {
        user_id: parseInt(user_id),
      },
      include: {
        users: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).send({
        status: "failure",
        message: "Student not found",
      });
    } else {
      // Delete related exam records
      await prisma.exams.deleteMany({
        where: {
          student_id: parseInt(user_id),
        },
      });

      // Delete the student record
      await prisma.students.delete({
        where: {
          user_id: parseInt(user_id),
        },
      });

      // Delete the user record
      await prisma.users.delete({
        where: {
          id: parseInt(user_id),
        },
      });

      return res.status(200).send({
        status: "success",
        message: "Student and related records deleted successfully",
        deletedUser: {
          id: parseInt(user_id),
          name: student.users.username,
        },
      });
    }
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
