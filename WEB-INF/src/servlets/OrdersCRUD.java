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

@WebServlet("/api/orders/*")
public class OrdersCRUD extends HttpServlet {
    private Gson gson = new Gson();

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            switch (action) {
                case "create":
                    createOrderUpdate(request, response);
                    break;
                case "update":
                    updateOrderUpdate(request, response);
                    break;
                case "delete":
                    deleteOrderUpdate(request, response);
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
            List<Map<String, Object>> orderUpdates = MySQLDataStoreUtilities.getRecords("OrderUpdates", null);
            response.getWriter().write(gson.toJson(orderUpdates));
        } catch (SQLException e) {
            response.getWriter().write(gson.toJson(createErrorResponse("Database error")));
            e.printStackTrace();
        }
    }

    private void createOrderUpdate(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        Map<String, Object> orderUpdateValues = new HashMap<>();
        orderUpdateValues.put("OrderID", request.getParameter("orderId"));
        orderUpdateValues.put("UpdateType", request.getParameter("updateType"));
        orderUpdateValues.put("UpdateDate", request.getParameter("updateDate"));
        orderUpdateValues.put("UpdateDetails", request.getParameter("updateDetails"));

        int updateId = MySQLDataStoreUtilities.insertRecord("OrderUpdates", orderUpdateValues);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Order Update created with ID: " + updateId);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private void updateOrderUpdate(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int updateId = Integer.parseInt(request.getParameter("updateId"));
        Map<String, Object> orderUpdateValues = new HashMap<>();
        orderUpdateValues.put("UpdateType", request.getParameter("updateType"));
        orderUpdateValues.put("UpdateDate", request.getParameter("updateDate"));
        orderUpdateValues.put("UpdateDetails", request.getParameter("updateDetails"));

        int rowsAffected = MySQLDataStoreUtilities.updateRecord("OrderUpdates", orderUpdateValues, "UpdateID = " + updateId);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Order Update updated. Rows affected: " + rowsAffected);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private void deleteOrderUpdate(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int updateId = Integer.parseInt(request.getParameter("updateId"));
        int rowsAffected = MySQLDataStoreUtilities.deleteRecord("OrderUpdates", "UpdateID = " + updateId);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Order Update deleted. Rows affected: " + rowsAffected);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private JsonObject createErrorResponse(String message) {
        JsonObject errorResponse = new JsonObject();
        errorResponse.addProperty("error", message);
        return errorResponse;
    }
}