import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;

@WebServlet({"/login", "/signup"})
public class AuthServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private String userFilePath;

    public void init() throws ServletException {
        userFilePath = getServletContext().getRealPath("/WEB-INF/users.txt");
    }

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
        String username = request.getParameter("username");
        String password = request.getParameter("password");

        try (BufferedReader reader = new BufferedReader(new FileReader(userFilePath))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 7 && (parts[1].equals(username) || parts[4].equals(username))) {
                    if (parts[5].equals(password)) {
                        String jsonResponse = String.format(
                            "{\"success\":true,\"message\":\"Login successful\",\"user\":{\"id\":\"%s\",\"username\":\"%s\",\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"role\":\"%s\"}}",
                            parts[0], parts[1], parts[2], parts[3], parts[4], parts[6]
                        );
                        response.getWriter().write(jsonResponse);
                    } else {
                        response.getWriter().write("{\"success\":false,\"message\":\"Invalid password\"}");
                    }
                    return;
                }
            }
            response.getWriter().write("{\"success\":false,\"message\":\"User not found\"}");
        } catch (FileNotFoundException e) {
            response.getWriter().write("{\"success\":false,\"message\":\"No users registered yet\"}");
        }
    }

    private void signup(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String username = request.getParameter("username");
        String firstName = request.getParameter("firstName");
        String lastName = request.getParameter("lastName");
        String email = request.getParameter("email");
        String password = request.getParameter("password");
        String role = request.getParameter("role");

        File file = new File(userFilePath);
        if (!file.exists()) {
            file.createNewFile();
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length > 1 && parts[1].equals(username)) {
                    response.getWriter().write("{\"success\":false,\"message\":\"Username already exists\"}");
                    return;
                }
            }
        }

        String userId = UUID.randomUUID().toString();

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file, true))) {
            writer.write(String.format("%s,%s,%s,%s,%s,%s,%s", userId, username, firstName, lastName, email, password, role));
            writer.newLine();
            String jsonResponse = String.format(
                "{\"success\":true,\"message\":\"Signup successful\",\"user\":{\"id\":\"%s\",\"username\":\"%s\",\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"role\":\"%s\"}}",
                userId, username, firstName, lastName, email, role
            );
            response.getWriter().write(jsonResponse);
        }
    }
}