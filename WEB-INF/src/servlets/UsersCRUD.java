package servlets;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.sql.*;
import java.util.*;
import utilities.MySQLDataStoreUtilities;
import com.google.gson.Gson;

@WebServlet("/api/users/*")
public class UsersCRUD extends HttpServlet {
    private Gson gson = new Gson();

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");

        try {
            switch (action) {
                case "create":
                    out.print(createUser(request));
                    break;
                case "update":
                    out.print(updateUser(request));
                    break;
                case "delete":
                    out.print(deleteUser(request));
                    break;
                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print(gson.toJson(Map.of("error", "Invalid action")));
            }
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print(gson.toJson(Map.of("error", "Database error: " + e.getMessage())));
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String pathInfo = request.getPathInfo(); // Get the path after /api/users/

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                // No userId specified, return all users
                List<Map<String, Object>> users = MySQLDataStoreUtilities.getRecords("Users", null);
                out.print(gson.toJson(Map.of("users", users)));
            } else {
                // userId is specified, retrieve the specific user
                String[] pathParts = pathInfo.split("/");
                if (pathParts.length > 1 && pathParts[1] != null && !pathParts[1].isEmpty()) {
                    int userId = Integer.parseInt(pathParts[1]);
                    Map<String, Object> user = getUserById(userId);

                    if (user == null) {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print(gson.toJson(Map.of("error", "User not found")));
                    } else {
                        out.print(gson.toJson(user));
                    }
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print(gson.toJson(Map.of("error", "Invalid user ID")));
                }
            }
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print(gson.toJson(Map.of("error", "Database error: " + e.getMessage())));
        }
    }

    private String createUser(HttpServletRequest request) throws SQLException, IOException {
        Map<String, Object> userValues = new HashMap<>();
        userValues.put("Username", request.getParameter("username"));
        userValues.put("PasswordHash", request.getParameter("passwordHash"));
        userValues.put("UserType", request.getParameter("userType"));
        userValues.put("FullName", request.getParameter("fullName"));
        userValues.put("Age", Integer.parseInt(request.getParameter("age")));
        userValues.put("Gender", request.getParameter("gender"));
        userValues.put("Street", request.getParameter("street"));
        userValues.put("City", request.getParameter("city"));
        userValues.put("State", request.getParameter("state"));
        userValues.put("ZipCode", request.getParameter("zipCode"));
        userValues.put("Email", request.getParameter("email"));
        userValues.put("PhoneNumber", request.getParameter("phoneNumber"));
        userValues.put("Occupation", request.getParameter("occupation"));
        userValues.put("ProfilePicture", request.getParameter("profilePicture"));

        int userId = MySQLDataStoreUtilities.insertRecord("Users", userValues);
        return gson.toJson(Map.of("message", "User created successfully", "userId", userId));
    }

    private String updateUser(HttpServletRequest request) throws SQLException, IOException {
        int userId = Integer.parseInt(request.getParameter("userId"));
        Map<String, Object> userValues = new HashMap<>();
        userValues.put("Username", request.getParameter("username"));
        userValues.put("PasswordHash", request.getParameter("passwordHash"));
        userValues.put("UserType", request.getParameter("userType"));
        userValues.put("FullName", request.getParameter("fullName"));
        userValues.put("Age", Integer.parseInt(request.getParameter("age")));
        userValues.put("Gender", request.getParameter("gender"));
        userValues.put("Street", request.getParameter("street"));
        userValues.put("City", request.getParameter("city"));
        userValues.put("State", request.getParameter("state"));
        userValues.put("ZipCode", request.getParameter("zipCode"));
        userValues.put("Email", request.getParameter("email"));
        userValues.put("PhoneNumber", request.getParameter("phoneNumber"));
        userValues.put("Occupation", request.getParameter("occupation"));
        userValues.put("ProfilePicture", request.getParameter("profilePicture"));

        int rowsAffected = MySQLDataStoreUtilities.updateRecord("Users", userValues, "UserID = " + userId);
        return gson.toJson(Map.of("message", "User updated successfully", "rowsAffected", rowsAffected));
    }

    private String deleteUser(HttpServletRequest request) throws SQLException, IOException {
        int userId = Integer.parseInt(request.getParameter("userId"));
        int rowsAffected = MySQLDataStoreUtilities.deleteRecord("Users", "UserID = " + userId);
        return gson.toJson(Map.of("message", "User deleted successfully", "rowsAffected", rowsAffected));
    }

    private Map<String, Object> getUserById(int userId) throws SQLException {
        List<Map<String, Object>> users = MySQLDataStoreUtilities.getRecords("Users", "UserID = " + userId);
        if (users.isEmpty()) {
            return null;
        } else {
            return users.get(0); 
        }
    }
}