package servlets;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.sql.*;
import java.util.*;
import utilities.MySQLDataStoreUtilities;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

@WebServlet("/api/customers/*")
public class CustomersCRUD extends HttpServlet {
    private Gson gson = new Gson();

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            switch (action) {
                case "create":
                    createCustomer(request, response);
                    break;
                case "update":
                    updateCustomer(request, response);
                    break;
                case "delete":
                    deleteCustomer(request, response);
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid action");
            }
        } catch (SQLException e) {
            response.getWriter().write(gson.toJson(createErrorResponse("Database error")));
            e.printStackTrace();
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        try {
            List<Map<String, Object>> customers = MySQLDataStoreUtilities.getRecords("Customers", null);
            response.getWriter().write(gson.toJson(customers));
        } catch (SQLException e) {
            response.getWriter().write(gson.toJson(createErrorResponse("Database error")));
            e.printStackTrace();
        }
    }

    private void createCustomer(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        Map<String, Object> customerValues = new HashMap<>();
        customerValues.put("UserID", Integer.parseInt(request.getParameter("userId")));

        int customerId = MySQLDataStoreUtilities.insertRecord("Customers", customerValues);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Customer created with ID: " + customerId);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private void updateCustomer(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int customerId = Integer.parseInt(request.getParameter("customerId"));
        Map<String, Object> customerValues = new HashMap<>();
        customerValues.put("UserID", Integer.parseInt(request.getParameter("userId")));

        int rowsAffected = MySQLDataStoreUtilities.updateRecord("Customers", customerValues, "CustomerID = " + customerId);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Customer updated. Rows affected: " + rowsAffected);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private void deleteCustomer(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int customerId = Integer.parseInt(request.getParameter("customerId"));
        int rowsAffected = MySQLDataStoreUtilities.deleteRecord("Customers", "CustomerID = " + customerId);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Customer deleted. Rows affected: " + rowsAffected);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private JsonObject createErrorResponse(String message) {
        JsonObject errorResponse = new JsonObject();
        errorResponse.addProperty("error", message);
        return errorResponse;
    }
}