import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.nio.file.*;

@WebServlet({"/orders", "/order", "/cancelOrder"})
public class OrderServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private String orderFilePath;

    public void init() throws ServletException {
        orderFilePath = getServletContext().getRealPath("/WEB-INF/orders.txt");
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getServletPath();
        if ("/orders".equals(action)) {
            createOrder(request, response);
        } else if ("/cancelOrder".equals(action)) {
            cancelOrder(request, response);
        }
    }

    private void createOrder(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Read the JSON data from the request body
        StringBuilder buffer = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        String data = buffer.toString();

        // Parse the JSON data
        Map<String, String> jsonMap = parseJson(data);

        String orderId = UUID.randomUUID().toString();
        String customerName = jsonMap.getOrDefault("customerName", "");
        String customerEmail = jsonMap.getOrDefault("customerEmail", "");
        String customerPhone = jsonMap.getOrDefault("customerPhone", "");
        String deliveryMethod = jsonMap.getOrDefault("deliveryMethod", "");
        String subtotal = jsonMap.getOrDefault("subtotal", "");
        String retailerDiscount = jsonMap.getOrDefault("retailerDiscount", "");
        String manufacturerRebate = jsonMap.getOrDefault("manufacturerRebate", "");
        String totalAmount = jsonMap.getOrDefault("totalAmount", "");
        String orderDate = jsonMap.getOrDefault("orderDate", "");
        String status = "Pending";  // Set initial status to Pending

        String orderData = String.join(",", 
            orderId, customerName, customerEmail, customerPhone, deliveryMethod,
            subtotal, retailerDiscount, manufacturerRebate, totalAmount, orderDate, status, data
        );

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(orderFilePath, true))) {
            writer.write(orderData);
            writer.newLine();
        }

        String jsonResponse = String.format(
            "{\"success\":true,\"message\":\"Order created successfully\",\"order\":{\"orderId\":\"%s\",\"customerName\":\"%s\",\"customerEmail\":\"%s\",\"totalAmount\":\"%s\"}}",
            orderId, customerName, customerEmail, totalAmount
        );
        response.getWriter().write(jsonResponse);
    }

    private void cancelOrder(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Read the JSON data from the request body
        StringBuilder buffer = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        String data = buffer.toString();

        // Parse the JSON data
        Map<String, String> jsonMap = parseJson(data);
        String orderId = jsonMap.get("orderId");

        if (orderId == null || orderId.isEmpty()) {
            response.getWriter().write("{\"success\":false,\"message\":\"Order ID is required\"}");
            return;
        }

        List<String> updatedOrders = new ArrayList<>();
        boolean orderFound = false;

        try (BufferedReader fileReader = new BufferedReader(new FileReader(orderFilePath))) {
            while ((line = fileReader.readLine()) != null) {
                String[] parts = line.split(",", 12);
                if (parts[0].equals(orderId)) {
                    // Update the status to "Cancelled"
                    parts[10] = "Cancelled";
                    // Update the full order JSON
                    String fullOrderJson = parts[11];
                    fullOrderJson = fullOrderJson.substring(0, fullOrderJson.length() - 1) + ",\"status\":\"Cancelled\"}";
                    parts[11] = fullOrderJson;
                    orderFound = true;
                }
                updatedOrders.add(String.join(",", parts));
            }
        }

        if (orderFound) {
            // Write the updated orders back to the file
            Files.write(Paths.get(orderFilePath), updatedOrders);
            response.getWriter().write("{\"success\":true,\"message\":\"Order cancelled successfully\"}");
        } else {
            response.getWriter().write("{\"success\":false,\"message\":\"Order not found\"}");
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String userId = request.getParameter("userId");
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (BufferedReader reader = new BufferedReader(new FileReader(orderFilePath))) {
            List<String> orders = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",", 12);  // Split only the first 11 fields
                if (userId == null || userId.isEmpty() || (parts.length > 2 && parts[2].equals(userId))) {
                    orders.add(String.format(
                        "{\"orderId\":\"%s\",\"customerName\":\"%s\",\"customerEmail\":\"%s\",\"totalAmount\":\"%s\",\"status\":\"%s\",\"fullOrder\":%s}",
                        parts[0], parts[1], parts[2], parts[8], parts[10], parts[11]  // parts[11] contains the full JSON
                    ));
                }
            }
            
            if (!orders.isEmpty()) {
                String jsonResponse = String.format(
                    "{\"success\":true,\"orders\":[%s]}",
                    String.join(",", orders)
                );
                response.getWriter().write(jsonResponse);
            } else {
                if (userId != null && !userId.isEmpty()) {
                    response.getWriter().write("{\"success\":false,\"message\":\"No orders found for the given user ID\"}");
                } else {
                    response.getWriter().write("{\"success\":false,\"message\":\"No orders found\"}");
                }
            }
        } catch (FileNotFoundException e) {
            response.getWriter().write("{\"success\":false,\"message\":\"No orders found\"}");
        }
    }

    private Map<String, String> parseJson(String json) {
        Map<String, String> map = new HashMap<>();
        json = json.trim();
        json = json.substring(1, json.length() - 1); // Remove the outer {}
        for (String pair : json.split(",")) {
            String[] keyValue = pair.split(":");
            if (keyValue.length == 2) {
                String key = keyValue[0].trim().replace("\"", "");
                String value = keyValue[1].trim().replace("\"", "");
                map.put(key, value);
            }
        }
        return map;
    }
}