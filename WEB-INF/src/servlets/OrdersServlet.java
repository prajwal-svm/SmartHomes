import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import utilities.MySQLDataStoreUtilities;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import java.sql.SQLException;
import java.time.LocalDateTime;

@WebServlet({"/orders", "/order", "/cancelOrder"})
public class OrdersServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private Gson gson;

    public OrdersServlet() {
        gson = new GsonBuilder()
            .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
            .create();
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

        try {
            BufferedReader reader = request.getReader();
            Map<String, Object> orderData = gson.fromJson(reader, new TypeToken<Map<String, Object>>(){}.getType());
            List<Map<String, Object>> products = (List<Map<String, Object>>) orderData.get("products");

            String orderId = UUID.randomUUID().toString();
            LocalDateTime purchaseDate = LocalDateTime.now();

            List<String> insertedTransactionIds = new ArrayList<>();

            for (Map<String, Object> product : products) {
                Map<String, Object> transactionValues = new HashMap<>();
                transactionValues.put("CustomerID", orderData.get("customerID"));
                transactionValues.put("StoreID", orderData.get("storeID"));
                transactionValues.put("ProductID", product.get("productID"));
                transactionValues.put("OrderID", orderId);
                transactionValues.put("PurchaseDate", purchaseDate);
                transactionValues.put("ShipDate", null);
                transactionValues.put("Quantity", product.get("quantity"));
                transactionValues.put("Price", product.get("price"));
                transactionValues.put("ShippingCost", product.get("shippingCost"));
                transactionValues.put("Discount", product.get("discount"));
                transactionValues.put("TotalSales", product.get("totalAmount"));
                transactionValues.put("ShippingAddressStreet", orderData.get("shippingStreet"));
                transactionValues.put("ShippingAddressCity", orderData.get("shippingCity"));
                transactionValues.put("ShippingAddressState", orderData.get("shippingState"));
                transactionValues.put("ShippingAddressZipCode", orderData.get("shippingZipCode"));
                transactionValues.put("StoreAddressStreet", orderData.get("storeStreet"));
                transactionValues.put("StoreAddressCity", orderData.get("storeCity"));
                transactionValues.put("StoreAddressState", orderData.get("storeState"));
                transactionValues.put("StoreAddressZipCode", orderData.get("storeZipCode"));
                transactionValues.put("CreditCardNumber", orderData.get("creditCardNumber"));
                transactionValues.put("OrderStatus", "Pending");

                int transactionId = MySQLDataStoreUtilities.insertRecord("Transactions", transactionValues);
                insertedTransactionIds.add(String.valueOf(transactionId));
            }

            // Insert into OrderUpdates table
            Map<String, Object> orderUpdateValues = new HashMap<>();
            orderUpdateValues.put("OrderID", orderId);
            orderUpdateValues.put("UpdateType", "Insert");
            orderUpdateValues.put("UpdateDate", purchaseDate);
            orderUpdateValues.put("UpdateDetails", "Order created with " + products.size() + " product(s)");

            MySQLDataStoreUtilities.insertRecord("OrderUpdates", orderUpdateValues);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("message", "Order created successfully");
            responseData.put("orderId", orderId);
            responseData.put("transactionIds", insertedTransactionIds);
            response.getWriter().write(gson.toJson(responseData));
        } catch (SQLException e) {
            sendErrorResponse(response, "Database error: " + e.getMessage());
        }
    }

    private void cancelOrder(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            BufferedReader reader = request.getReader();
            Map cancelData = gson.fromJson(reader, Map.class);
            String orderId = (String) cancelData.get("orderId");

            if (orderId == null || orderId.isEmpty()) {
                sendErrorResponse(response, "Order ID is required");
                return;
            }

            // Update Transactions table
            Map<String, Object> updateValues = new HashMap<>();
            updateValues.put("OrderStatus", "Cancelled");
            int rowsAffected = MySQLDataStoreUtilities.updateRecord("Transactions", updateValues, "OrderID = '" + orderId + "'");

            if (rowsAffected > 0) {
                // Insert into OrderUpdates table
                Map<String, Object> orderUpdateValues = new HashMap<>();
                orderUpdateValues.put("OrderID", orderId);
                orderUpdateValues.put("UpdateType", "Update");
                orderUpdateValues.put("UpdateDate", LocalDateTime.now());
                orderUpdateValues.put("UpdateDetails", "Order cancelled");

                MySQLDataStoreUtilities.insertRecord("OrderUpdates", orderUpdateValues);

                sendSuccessResponse(response, "Order cancelled successfully");
            } else {
                sendErrorResponse(response, "Order not found");
            }
        } catch (SQLException e) {
            sendErrorResponse(response, "Database error: " + e.getMessage());
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String userId = request.getParameter("userId");
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String whereClause = userId != null && !userId.isEmpty() ? 
                "CustomerID = " + userId : null;

            List<Map<String, Object>> orders = MySQLDataStoreUtilities.getRecords("Transactions", whereClause);

            if (!orders.isEmpty()) {
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("success", true);
                responseData.put("orders", orders);
                response.getWriter().write(gson.toJson(responseData));
            } else {
                if (userId != null && !userId.isEmpty()) {
                    sendErrorResponse(response, "No orders found for the given user ID");
                } else {
                    sendErrorResponse(response, "No orders found");
                }
            }
        } catch (SQLException e) {
            sendErrorResponse(response, "Database error: " + e.getMessage());
        }
    }

    private void sendErrorResponse(HttpServletResponse response, String message) throws IOException {
        response.getWriter().write(gson.toJson(Map.of("success", false, "message", message)));
    }

    private void sendSuccessResponse(HttpServletResponse response, String message) throws IOException {
        response.getWriter().write(gson.toJson(Map.of("success", true, "message", message)));
    }

    private static class LocalDateTimeAdapter extends TypeAdapter<LocalDateTime> {
        @Override
        public void write(JsonWriter out, LocalDateTime value) throws IOException {
            out.value(value != null ? value.toString() : null);
        }

        @Override
        public LocalDateTime read(JsonReader in) throws IOException {
            return LocalDateTime.parse(in.nextString());
        }
    }
}