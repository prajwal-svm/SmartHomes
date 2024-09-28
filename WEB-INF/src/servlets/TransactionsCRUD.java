package servlets;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;
import java.sql.*;
import java.util.*;
import utilities.MySQLDataStoreUtilities;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@WebServlet("/api/transactions/*")
public class TransactionsCRUD extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            switch (action) {
                case "create":
                    createTransaction(request, response);
                    break;
                case "update":
                    updateTransaction(request, response);
                    break;
                case "delete":
                    deleteTransaction(request, response);
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid action");
            }
        } catch (SQLException e) {
            response.getWriter().write(createErrorResponse("Database error"));
            e.printStackTrace();
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo(); // Get the path after /api/transactions/

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                // No transactionId specified, return all transactions
                List<Map<String, Object>> transactions = MySQLDataStoreUtilities.getRecords("Transactions", null);
                formatTransactionDates(transactions); // Format dates for all transactions
                response.getWriter().write(convertToJson(transactions));
            } else {
                // transactionId is specified, retrieve the specific transaction
                String[] pathParts = pathInfo.split("/");
                if (pathParts.length > 1 && pathParts[1] != null && !pathParts[1].isEmpty()) {
                    int transactionId = Integer.parseInt(pathParts[1]);
                    Map<String, Object> transaction = getTransactionById(transactionId);

                    if (transaction == null) {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        response.getWriter().write(createErrorResponse("Transaction not found"));
                    } else {
                        formatTransactionDates(Collections.singletonList(transaction)); // Format dates for the specific transaction
                        response.getWriter().write(convertToJson(Collections.singletonList(transaction)));
                    }
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write(createErrorResponse("Invalid transaction ID"));
                }
            }
        } catch (SQLException e) {
            response.getWriter().write(createErrorResponse("Database error"));
            e.printStackTrace();
        }
    }

    private String convertToJson(List<Map<String, Object>> transactions) {
        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("[");
        for (int i = 0; i < transactions.size(); i++) {
            Map<String, Object> transaction = transactions.get(i);
            jsonBuilder.append("{");
            for (Map.Entry<String, Object> entry : transaction.entrySet()) {
                jsonBuilder.append("\"").append(entry.getKey()).append("\":");
                jsonBuilder.append("\"").append(entry.getValue()).append("\"");
                jsonBuilder.append(",");
            }
            jsonBuilder.setLength(jsonBuilder.length() - 1); // Remove last comma
            jsonBuilder.append("}");
            if (i < transactions.size() - 1) {
                jsonBuilder.append(",");
            }
        }
        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }

    private String createErrorResponse(String message) {
        return "{\"error\":\"" + message + "\"}"; // Manually create JSON error response
    }

    private void createTransaction(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        Map<String, Object> transactionValues = new HashMap<>();
        transactionValues.put("CustomerID", Integer.parseInt(request.getParameter("customerId")));
        transactionValues.put("StoreID", Integer.parseInt(request.getParameter("storeId")));
        transactionValues.put("ProductID", Integer.parseInt(request.getParameter("productId")));
        transactionValues.put("OrderID", request.getParameter("orderId"));
        transactionValues.put("PurchaseDate", request.getParameter("purchaseDate"));
        transactionValues.put("ShipDate", request.getParameter("shipDate"));
        transactionValues.put("Quantity", Integer.parseInt(request.getParameter("quantity")));
        transactionValues.put("Price", Double.parseDouble(request.getParameter("price")));
        transactionValues.put("ShippingCost", Double.parseDouble(request.getParameter("shippingCost")));
        transactionValues.put("Discount", Double.parseDouble(request.getParameter("discount")));
        transactionValues.put("TotalSales", Double.parseDouble(request.getParameter("totalSales")));
        transactionValues.put("ShippingAddressStreet", request.getParameter("shippingAddressStreet"));
        transactionValues.put("ShippingAddressCity", request.getParameter("shippingAddressCity"));
        transactionValues.put("ShippingAddressState", request.getParameter("shippingAddressState"));
        transactionValues.put("ShippingAddressZipCode", request.getParameter("shippingAddressZipCode"));
        transactionValues.put("StoreAddressStreet", request.getParameter("storeAddressStreet"));
        transactionValues.put("StoreAddressCity", request.getParameter("storeAddressCity"));
        transactionValues.put("StoreAddressState", request.getParameter("storeAddressState"));
        transactionValues.put("StoreAddressZipCode", request.getParameter("storeAddressZipCode"));
        transactionValues.put("CreditCardNumber", request.getParameter("creditCardNumber"));
        transactionValues.put("OrderStatus", request.getParameter("orderStatus"));
        transactionValues.put("Category", request.getParameter("category"));

        int transactionId = MySQLDataStoreUtilities.insertRecord("Transactions", transactionValues);
        response.getWriter().write("{\"message\":\"Transaction created with ID: " + transactionId + "\"}");
    }

    private void updateTransaction(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int transactionId = Integer.parseInt(request.getParameter("transactionId"));
        Map<String, Object> transactionValues = new HashMap<>();
        transactionValues.put("ShipDate", request.getParameter("shipDate"));
        transactionValues.put("OrderStatus", request.getParameter("orderStatus"));
        transactionValues.put("Category", request.getParameter("category")); 

        int rowsAffected = MySQLDataStoreUtilities.updateRecord("Transactions", transactionValues, "TransactionID = " + transactionId);
        response.getWriter().write("{\"message\":\"Transaction updated. Rows affected: " + rowsAffected + "\"}");
    }

    private void deleteTransaction(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int transactionId = Integer.parseInt(request.getParameter("transactionId"));
        int rowsAffected = MySQLDataStoreUtilities.deleteRecord("Transactions", "TransactionID = " + transactionId);
        response.getWriter().write("{\"message\":\"Transaction deleted. Rows affected: " + rowsAffected + "\"}");
    }

    private Map<String, Object> getTransactionById(int transactionId) throws SQLException {
        List<Map<String, Object>> transactions = MySQLDataStoreUtilities.getRecords("Transactions", "TransactionID = " + transactionId);
        if (transactions.isEmpty()) {
            return null;
        } else {
            return transactions.get(0);
        }
    }

    private void formatTransactionDates(List<Map<String, Object>> transactions) {
        // Format LocalDateTime to String for each transaction
        for (Map<String, Object> transaction : transactions) {
            if (transaction.get("PurchaseDate") instanceof LocalDateTime) {
                transaction.put("PurchaseDate", ((LocalDateTime) transaction.get("PurchaseDate"))
                        .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
            if (transaction.get("ShipDate") instanceof LocalDateTime) {
                transaction.put("ShipDate", ((LocalDateTime) transaction.get("ShipDate"))
                        .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
        }
    }
}