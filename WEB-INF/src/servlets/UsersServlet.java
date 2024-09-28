import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;
import java.util.*;
import java.sql.SQLException;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import utilities.MySQLDataStoreUtilities;

@WebServlet("/users/*")
public class UsersServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private Gson gson = new Gson();

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        PrintWriter out = response.getWriter();

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                // Return all users
                List<Map<String, Object>> users = MySQLDataStoreUtilities.getRecords("Users", null);
                out.print(gson.toJson(users));
            } else {
                String[] splits = pathInfo.split("/");
                if (splits.length == 2) {
                    int userId = Integer.parseInt(splits[1]);
                    List<Map<String, Object>> users = MySQLDataStoreUtilities.getRecords("Users", "UserID = " + userId);
                    if (!users.isEmpty()) {
                        out.print(gson.toJson(users.get(0)));
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\": \"User not found\"}");
                    }
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"error\": \"Invalid request\"}");
                }
            }
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\": \"Database error: " + e.getMessage() + "\"}");
        }
        out.flush();
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        BufferedReader reader = request.getReader();
        Map<String, Object> userData = gson.fromJson(reader, new TypeToken<Map<String, Object>>(){}.getType());

        PrintWriter out = response.getWriter();
        try {
            int userId = MySQLDataStoreUtilities.insertRecord("Users", userData);
            userData.put("UserID", userId);
            out.print(gson.toJson(userData));
            response.setStatus(HttpServletResponse.SC_CREATED);
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\": \"Database error: " + e.getMessage() + "\"}");
        }
        out.flush();
    }

    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        PrintWriter out = response.getWriter();

        if (pathInfo == null || pathInfo.equals("/")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"error\": \"User ID is required\"}");
        } else {
            String[] splits = pathInfo.split("/");
            if (splits.length == 2) {
                int userId = Integer.parseInt(splits[1]);
                BufferedReader reader = request.getReader();
                Map<String, Object> updatedUser = gson.fromJson(reader, new TypeToken<Map<String, Object>>(){}.getType());

                try {
                    int rowsAffected = MySQLDataStoreUtilities.updateRecord("Users", updatedUser, "UserID = " + userId);
                    if (rowsAffected > 0) {
                        List<Map<String, Object>> users = MySQLDataStoreUtilities.getRecords("Users", "UserID = " + userId);
                        out.print(gson.toJson(users.get(0)));
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\": \"User not found\"}");
                    }
                } catch (SQLException e) {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"error\": \"Database error: " + e.getMessage() + "\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Invalid request\"}");
            }
        }
        out.flush();
    }

    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        PrintWriter out = response.getWriter();

        if (pathInfo == null || pathInfo.equals("/")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"error\": \"User ID is required\"}");
        } else {
            String[] splits = pathInfo.split("/");
            if (splits.length == 2) {
                int userId = Integer.parseInt(splits[1]);
                try {
                    int rowsAffected = MySQLDataStoreUtilities.deleteRecord("Users", "UserID = " + userId);
                    if (rowsAffected > 0) {
                        out.print("{\"message\": \"User deleted successfully\"}");
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\": \"User not found\"}");
                    }
                } catch (SQLException e) {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"error\": \"Database error: " + e.getMessage() + "\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Invalid request\"}");
            }
        }
        out.flush();
    }
}