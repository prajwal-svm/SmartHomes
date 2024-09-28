import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.nio.file.*;
import java.util.UUID;

@WebServlet({"/salesOrder", "/salesOrder/*"})
public class SalesOrderServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private String orderFilePath;

    public void init() throws ServletException {
        orderFilePath = getServletContext().getRealPath("/WEB-INF/orders.txt");
    }

    // POST /salesOrder
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        StringBuilder buffer = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        String data = buffer.toString();

        // Parse the JSON data
        Map<String, String> jsonMap = parseJson(data);

        // Create a new Sales Order
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
        String status =  jsonMap.getOrDefault("status", "Pending");

        String orderData = String.join(",", 
            orderId, customerName, customerEmail, customerPhone, deliveryMethod,
            subtotal, retailerDiscount, manufacturerRebate, totalAmount, orderDate, status, data
        );

        // Write to the file
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(orderFilePath, true))) {
            writer.write(orderData);
            writer.newLine();
        }

        String jsonResponse = String.format(
            "{\"success\":true,\"message\":\"Sales order created successfully\",\"order\":{\"orderId\":\"%s\",\"customerName\":\"%s\",\"customerEmail\":\"%s\",\"totalAmount\":\"%s\"}}",
            orderId, customerName, customerEmail, totalAmount
        );
        response.getWriter().write(jsonResponse);
    }

    // PUT /salesOrder/{id}
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"Sales order ID is required\"}");
            return;
        }

        String orderId = pathInfo.split("/")[1];  // Get the order ID from the path

        // Read the incoming JSON data
        StringBuilder buffer = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        String jsonData = buffer.toString();

        // Parse the updated order data
        Map<String, String> jsonMap = parseJson(jsonData);

        // Update the order in the file
        List<String> updatedOrders = new ArrayList<>();
        boolean orderFound = false;

        try (BufferedReader fileReader = new BufferedReader(new FileReader(orderFilePath))) {
            while ((line = fileReader.readLine()) != null) {
                String[] parts = line.split(",", 12);  // Split the fields (limit 12 to capture the order JSON)
                if (parts[0].equals(orderId)) {
                    orderFound = true;

                    // Update the fields from the input JSON
                    parts[1] = jsonMap.getOrDefault("customerName", parts[1]);
                    parts[2] = jsonMap.getOrDefault("customerEmail", parts[2]);
                    parts[3] = jsonMap.getOrDefault("customerPhone", parts[3]);
                    parts[4] = jsonMap.getOrDefault("deliveryMethod", parts[4]);
                    parts[5] = jsonMap.getOrDefault("subtotal", parts[5]);
                    parts[6] = jsonMap.getOrDefault("retailerDiscount", parts[6]);
                    parts[7] = jsonMap.getOrDefault("manufacturerRebate", parts[7]);
                    parts[8] = jsonMap.getOrDefault("totalAmount", parts[8]);
                    parts[10] = jsonMap.getOrDefault("status", parts[10]);

                    String updatedOrderJson = parts[11]; // Keep the existing order JSON

                    // Rebuild the updated order line
                    updatedOrders.add(String.join(",", parts));
                } else {
                    updatedOrders.add(line);  // Keep the other orders unchanged
                }
            }
        }

        if (orderFound) {
            Files.write(Paths.get(orderFilePath), updatedOrders);
            response.getWriter().write("{\"success\":true,\"message\":\"Sales order updated successfully\"}");
        } else {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.getWriter().write("{\"error\":\"Sales order not found\"}");
        }
    }

    // DELETE /salesOrder/{id}
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"Sales order ID is required\"}");
            return;
        }

        String orderId = pathInfo.split("/")[1];  // Get the order ID from the path

        // Find and delete the order
        List<String> updatedOrders = new ArrayList<>();
        boolean orderFound = false;

        try (BufferedReader fileReader = new BufferedReader(new FileReader(orderFilePath))) {
            String line;
            while ((line = fileReader.readLine()) != null) {
                String[] parts = line.split(",", 12);  // Split the fields
                if (parts[0].equals(orderId)) {
                    orderFound = true;
                    // Skip this order, effectively deleting it
                } else {
                    updatedOrders.add(line);  // Keep the other orders unchanged
                }
            }
        }

        if (orderFound) {
            Files.write(Paths.get(orderFilePath), updatedOrders);
            response.getWriter().write("{\"success\":true,\"message\":\"Sales order deleted successfully\"}");
        } else {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.getWriter().write("{\"error\":\"Sales order not found\"}");
        }
    }

    // Utility method to parse JSON string into a map
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
