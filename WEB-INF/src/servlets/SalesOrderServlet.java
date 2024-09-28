import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import utilities.MySQLDataStoreUtilities;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.sql.SQLException;

@WebServlet({"/salesOrder", "/salesOrder/*"})
public class SalesOrderServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private Gson gson = new Gson();

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            BufferedReader reader = request.getReader();
            Map<String, Object> orderData = gson.fromJson(reader, new TypeToken<Map<String, Object>>(){}.getType());

            // Create a new Sales Order
            String orderId = UUID.randomUUID().toString();
            orderData.put("OrderID", orderId);
            orderData.put("PurchaseDate", new java.sql.Timestamp(System.currentTimeMillis()));
            orderData.put("OrderStatus", "Pending");

            int transactionId = MySQLDataStoreUtilities.insertRecord("Transactions", orderData);

            // Insert into OrderUpdates table
            Map<String, Object> updateData = new HashMap<>();
            updateData.put("OrderID", orderId);
            updateData.put("UpdateType", "Insert");
            updateData.put("UpdateDate", new java.sql.Timestamp(System.currentTimeMillis()));
            updateData.put("UpdateDetails", "Order created");
            MySQLDataStoreUtilities.insertRecord("OrderUpdates", updateData);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("message", "Sales order created successfully");
            responseData.put("order", orderData);
            response.getWriter().write(gson.toJson(responseData));
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(gson.toJson(Collections.singletonMap("error", "Database error: " + e.getMessage())));
        }
    }

    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(gson.toJson(Collections.singletonMap("error", "Sales order ID is required")));
            return;
        }

        String orderId = pathInfo.split("/")[1];

        try {
            BufferedReader reader = request.getReader();
            Map<String, Object> updatedData = gson.fromJson(reader, new TypeToken<Map<String, Object>>(){}.getType());

            int rowsAffected = MySQLDataStoreUtilities.updateRecord("Transactions", updatedData, "OrderID = '" + orderId + "'");

            if (rowsAffected > 0) {
                // Insert into OrderUpdates table
                Map<String, Object> updateData = new HashMap<>();
                updateData.put("OrderID", orderId);
                updateData.put("UpdateType", "Update");
                updateData.put("UpdateDate", new java.sql.Timestamp(System.currentTimeMillis()));
                updateData.put("UpdateDetails", "Order updated");
                MySQLDataStoreUtilities.insertRecord("OrderUpdates", updateData);

                response.getWriter().write(gson.toJson(Collections.singletonMap("success", true)));
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.getWriter().write(gson.toJson(Collections.singletonMap("error", "Sales order not found")));
            }
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(gson.toJson(Collections.singletonMap("error", "Database error: " + e.getMessage())));
        }
    }

    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(gson.toJson(Collections.singletonMap("error", "Sales order ID is required")));
            return;
        }

        String orderId = pathInfo.split("/")[1];

        try {
            // Instead of deleting, we'll update the status to 'Cancelled'
            Map<String, Object> updateData = new HashMap<>();
            updateData.put("OrderStatus", "Cancelled");
            
            int rowsAffected = MySQLDataStoreUtilities.updateRecord("Transactions", updateData, "OrderID = '" + orderId + "'");

            if (rowsAffected > 0) {
                // Insert into OrderUpdates table
                Map<String, Object> updateData2 = new HashMap<>();
                updateData2.put("OrderID", orderId);
                updateData2.put("UpdateType", "Update");
                updateData2.put("UpdateDate", new java.sql.Timestamp(System.currentTimeMillis()));
                updateData2.put("UpdateDetails", "Order cancelled");
                MySQLDataStoreUtilities.insertRecord("OrderUpdates", updateData2);

                response.getWriter().write(gson.toJson(Collections.singletonMap("success", true)));
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.getWriter().write(gson.toJson(Collections.singletonMap("error", "Sales order not found")));
            }
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(gson.toJson(Collections.singletonMap("error", "Database error: " + e.getMessage())));
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        PrintWriter out = response.getWriter();

        try {
            List<Map<String, Object>> orders;
            if (pathInfo == null || pathInfo.equals("/")) {
                // Get all orders
                orders = MySQLDataStoreUtilities.getRecords("Transactions", null);
            } else {
                // Get specific order
                String orderId = pathInfo.split("/")[1];
                orders = MySQLDataStoreUtilities.getRecords("Transactions", "OrderID = '" + orderId + "'");
            }

            if (!orders.isEmpty()) {
                out.print(gson.toJson(orders));
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print(gson.toJson(Collections.singletonMap("error", "No orders found")));
            }
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print(gson.toJson(Collections.singletonMap("error", "Database error: " + e.getMessage())));
        }
        out.flush();
    }
}