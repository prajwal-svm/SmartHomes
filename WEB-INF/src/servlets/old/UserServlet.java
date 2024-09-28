import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;
import java.util.*;
import java.util.stream.Collectors;

@WebServlet("/users/*")
public class UserServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private List<User> users;
    private String usersFilePath;

    public void init() throws ServletException {
        usersFilePath = getServletContext().getRealPath("/WEB-INF/users.txt");
        users = parseUsersFromFile();
    }

    // Handle GET requests for users
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        String pathInfo = request.getPathInfo();

        if (pathInfo == null || pathInfo.equals("/")) {
            // Return all users
            out.print(toJson(users));
        } else {
            String[] splits = pathInfo.split("/");
            if (splits.length == 2) {
                String userId = splits[1];
                User user = findUserById(userId);
                if (user != null) {
                    out.print(user.toJson());
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"error\": \"User not found\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Invalid request\"}");
            }
        }
        out.flush();
    }

    // Handle POST requests to create a new user
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        BufferedReader reader = request.getReader();
        StringBuilder jsonBuilder = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            jsonBuilder.append(line);
        }
        String json = jsonBuilder.toString();

        User newUser = User.fromJson(json);
        users.add(newUser);
        saveUsersToFile();

        PrintWriter out = response.getWriter();
        out.print(newUser.toJson());
        out.flush();

        response.setStatus(HttpServletResponse.SC_CREATED);
    }

    // Parse users from file
    private List<User> parseUsersFromFile() {
        List<User> userList = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(usersFilePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 7) {
                    User user = new User(
                        parts[0], // id
                        parts[1], // email
                        parts[2], // firstName
                        parts[3], // lastName
                        parts[4], // contactEmail
                        parts[5], // password
                        parts[6]  // role
                    );
                    userList.add(user);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return userList;
    }

    // Save users to file
    private void saveUsersToFile() {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(usersFilePath))) {
            for (User user : users) {
                bw.write(String.format("%s,%s,%s,%s,%s,%s,%s\n",
                    user.id,
                    user.email,
                    user.firstName,
                    user.lastName,
                    user.contactEmail,
                    user.password,
                    user.role
                ));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // Find user by ID
    private User findUserById(String id) {
        for (User user : users) {
            if (user.id.equals(id)) {
                return user;
            }
        }
        return null;
    }

    // Convert the list of users to JSON
    private String toJson(List<User> users) {
        return users.stream().map(User::toJson).collect(Collectors.joining(",", "[", "]"));
    }

    // User class representing the data model
    private static class User {
        String id;
        String email;
        String firstName;
        String lastName;
        String contactEmail;
        String password;
        String role;

        User(String id, String email, String firstName, String lastName, String contactEmail, String password, String role) {
            this.id = id;
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
            this.contactEmail = contactEmail;
            this.password = password;
            this.role = role;
        }

        // Convert User object to JSON string
        String toJson() {
            return String.format(
                "{\"id\":\"%s\",\"role\":\"%s\",\"email\":\"%s\",\"firstName\":\"%s\",\"lastName\":\"%s\"}",
                escapeJson(id),
                escapeJson(role),
                escapeJson(email),
                escapeJson(firstName),
                escapeJson(lastName)
            );
        }

        // Create a User object from a JSON string
        static User fromJson(String json) throws IOException {
            Map<String, String> map = new HashMap<>();
            json = json.substring(1, json.length() - 1); // Remove { }
            String[] pairs = json.split(",");
            for (String pair : pairs) {
                String[] keyValue = pair.split(":");
                if (keyValue.length == 2) {  // Ensure there are two parts (key and value)
                    String key = keyValue[0].trim().replace("\"", "");
                    String value = keyValue[1].trim().replace("\"", "");
                    map.put(key, value);
                }
            }

            // Generate a new UUID for the user ID if not provided in the request
            String id = map.getOrDefault("id", UUID.randomUUID().toString());

            return new User(
                id,
                map.get("email"),
                map.get("firstName"),
                map.get("lastName"),
                map.get("contactEmail"),
                map.get("password"),
                map.get("role")
            );
        }

        // Escape JSON special characters
        private String escapeJson(String input) {
            if (input == null) {
                return "";
            }
            return input.replace("\"", "\\\"")
                        .replace("\n", "\\n")
                        .replace("\r", "\\r")
                        .replace("\t", "\\t");
        }
    }
}
