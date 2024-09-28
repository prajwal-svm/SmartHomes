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

@WebServlet("/api/storeManagers/*")
public class StoreManagersCRUD extends HttpServlet {
    private Gson gson = new Gson();

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            switch (action) {
                case "create":
                    createStoreManager(request, response);
                    break;
                case "update":
                    updateStoreManager(request, response);
                    break;
                case "delete":
                    deleteStoreManager(request, response);
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
            List<Map<String, Object>> storeManagers = MySQLDataStoreUtilities.getRecords("StoreManagers", null);
            response.getWriter().write(gson.toJson(storeManagers));
        } catch (SQLException e) {
            response.getWriter().write(gson.toJson(createErrorResponse("Database error")));
            e.printStackTrace();
        }
    }

    private void createStoreManager(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        Map<String, Object> storeManagerValues = new HashMap<>();
        storeManagerValues.put("UserID", Integer.parseInt(request.getParameter("userId")));
        storeManagerValues.put("StoreID", Integer.parseInt(request.getParameter("storeId")));

        int managerId = MySQLDataStoreUtilities.insertRecord("StoreManagers", storeManagerValues);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Store Manager created with ID: " + managerId);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private void updateStoreManager(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int managerId = Integer.parseInt(request.getParameter("managerId"));
        Map<String, Object> storeManagerValues = new HashMap<>();
        storeManagerValues.put("UserID", Integer.parseInt(request.getParameter("userId")));
        storeManagerValues.put("StoreID", Integer.parseInt(request.getParameter("storeId")));

        int rowsAffected = MySQLDataStoreUtilities.updateRecord("StoreManagers", storeManagerValues, "ManagerID = " + managerId);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Store Manager updated. Rows affected: " + rowsAffected);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private void deleteStoreManager(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int managerId = Integer.parseInt(request.getParameter("managerId"));
        int rowsAffected = MySQLDataStoreUtilities.deleteRecord("StoreManagers", "ManagerID = " + managerId);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Store Manager deleted. Rows affected: " + rowsAffected);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private JsonObject createErrorResponse(String message) {
        JsonObject errorResponse = new JsonObject();
        errorResponse.addProperty("error", message);
        return errorResponse;
    }
}