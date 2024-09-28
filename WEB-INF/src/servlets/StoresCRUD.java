package servlets;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.sql.*;
import java.util.*;
import com.google.gson.Gson;
import utilities.MySQLDataStoreUtilities;

@WebServlet("/api/stores/*")
public class StoresCRUD extends HttpServlet {
    private Gson gson = new Gson(); 

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        try {
            switch (action) {
                case "create":
                    createStore(request, response);
                    break;
                case "update":
                    updateStore(request, response);
                    break;
                case "delete":
                    deleteStore(request, response);
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST, gson.toJson(new ErrorResponse("Invalid action")));
            }
        } catch (SQLException e) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, gson.toJson(new ErrorResponse("Database error")));
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        String pathInfo = request.getPathInfo(); 

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                List<Map<String, Object>> stores = MySQLDataStoreUtilities.getRecords("Stores", null);
                response.getWriter().write(gson.toJson(stores));
            } else {
                String[] pathParts = pathInfo.split("/");
                if (pathParts.length > 1 && pathParts[1] != null && !pathParts[1].isEmpty()) {
                    int storeId = Integer.parseInt(pathParts[1]);
                    Map<String, Object> store = getStoreById(storeId);

                    if (store == null) {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        response.getWriter().write(gson.toJson(new ErrorResponse("Store not found")));
                    } else {
                        response.getWriter().write(gson.toJson(store));
                    }
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write(gson.toJson(new ErrorResponse("Invalid store ID")));
                }
            }
        } catch (SQLException e) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, gson.toJson(new ErrorResponse("Database error")));
        }
    }

    private void createStore(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        Map<String, Object> storeValues = new HashMap<>();
        storeValues.put("StoreName", request.getParameter("storeName"));
        storeValues.put("Street", request.getParameter("street"));
        storeValues.put("City", request.getParameter("city"));
        storeValues.put("State", request.getParameter("state"));
        storeValues.put("ZipCode", request.getParameter("zipCode"));

        int storeId = MySQLDataStoreUtilities.insertRecord("Stores", storeValues);
        response.getWriter().write(gson.toJson(new SuccessResponse("Store created with ID: " + storeId)));
    }

    private void updateStore(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int storeId = Integer.parseInt(request.getParameter("storeId"));
        Map<String, Object> storeValues = new HashMap<>();
        storeValues.put("StoreName", request.getParameter("storeName"));
        storeValues.put("Street", request.getParameter("street"));
        storeValues.put("City", request.getParameter("city"));
        storeValues.put("State", request.getParameter("state"));
        storeValues.put("ZipCode", request.getParameter("zipCode"));

        int rowsAffected = MySQLDataStoreUtilities.updateRecord("Stores", storeValues, "StoreID = " + storeId);
        response.getWriter().write(gson.toJson(new SuccessResponse("Store updated. Rows affected: " + rowsAffected)));
    }

    private void deleteStore(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int storeId = Integer.parseInt(request.getParameter("storeId"));
        int rowsAffected = MySQLDataStoreUtilities.deleteRecord("Stores", "StoreID = " + storeId);
        response.getWriter().write(gson.toJson(new SuccessResponse("Store deleted. Rows affected: " + rowsAffected)));
    }

    private Map<String, Object> getStoreById(int storeId) throws SQLException {
        List<Map<String, Object>> stores = MySQLDataStoreUtilities.getRecords("Stores", "StoreID = " + storeId);
        if (stores.isEmpty()) {
            return null;
        } else {
            return stores.get(0); 
        }
    }

    private class SuccessResponse {
        String message;

        SuccessResponse(String message) {
            this.message = message;
        }
    }

    private class ErrorResponse {
        String error;

        ErrorResponse(String error) {
            this.error = error;
        }
    }
}