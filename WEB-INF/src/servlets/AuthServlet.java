import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import utilities.MySQLDataStoreUtilities;
import com.google.gson.Gson;
import java.sql.SQLException;

@WebServlet({"/login", "/signup"})
public class AuthServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private Gson gson = new Gson();

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String action = request.getServletPath();
        if ("/login".equals(action)) {
            login(request, response);
        } else if ("/signup".equals(action)) {
            signup(request, response);
        }
    }

    private void login(HttpServletRequest request, HttpServletResponse response) throws IOException {
        BufferedReader reader = request.getReader();
        Map<String, String> loginData = gson.fromJson(reader, Map.class);
        String username = loginData.get("username");
        String password = loginData.get("password");

        try {
            List<Map<String, Object>> users = MySQLDataStoreUtilities.getRecords("Users", "Email = '" + username + "' OR Email = '" + username + "'");
            if (!users.isEmpty()) {
                Map<String, Object> user = users.get(0);
                // TODO: Implement password hashing and verification
                if (user.get("PasswordHash").equals(password)) { 
                    Map<String, Object> responseData = new HashMap<>();
                    responseData.put("success", true);
                    responseData.put("message", "Login successful");
                    
                    // Get user object and CustomerID
                    Map<String, Object> userWithCustomerId = new HashMap<>(user);
                    List<Map<String, Object>> customerRecords = MySQLDataStoreUtilities.getRecords("Customers", "UserID = " + user.get("UserID"));
                    if (!customerRecords.isEmpty()) {
                        userWithCustomerId.put("CustomerID", customerRecords.get(0).get("CustomerID"));
                    }
                    
                    responseData.put("user", userWithCustomerId);
                    response.getWriter().write(gson.toJson(responseData));
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write("{\"success\":false,\"message\":\"Invalid username or password\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.getWriter().write("{\"success\":false,\"message\":\"User not found\"}");
            }
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"success\":false,\"message\":\"Database error\"}");
            e.printStackTrace();
        }
    }

    private void signup(HttpServletRequest request, HttpServletResponse response) throws IOException {
        BufferedReader reader = request.getReader();
        Map<String, Object> signupData = gson.fromJson(reader, Map.class);

        try {
            List<Map<String, Object>> existingUsers = MySQLDataStoreUtilities.getRecords("Users", "Username = '" + signupData.get("Username") + "'");
            if (!existingUsers.isEmpty()) {
                response.getWriter().write("{\"success\":false,\"message\":\"Username/Email already exists!\"}");
                return;
            }

            int userId = MySQLDataStoreUtilities.insertRecord("Users", signupData);
            if (userId != -1) {
                int customerId = -1; // Initialize customerId
                if ("Customer".equals(signupData.get("userType"))) {
                    Map<String, Object> customerData = new HashMap<>();
                    customerData.put("UserID", userId);
                    customerId = MySQLDataStoreUtilities.insertRecord("Customers", customerData);
                }
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("success", true);
                responseData.put("message", "Signup successful");
                responseData.put("user", signupData);
                responseData.put("userId", userId);
                responseData.put("customerId", customerId); // Include customerId in response
                response.getWriter().write(gson.toJson(responseData));
            } else {
                response.getWriter().write("{\"success\":false,\"message\":\"Failed to create user\"}");
            }
        } catch (SQLException e) {
            response.getWriter().write("{\"success\":false,\"message\":\"Database error\"}");
            e.printStackTrace();
        }
    }
}