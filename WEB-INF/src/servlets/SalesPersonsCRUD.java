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

@WebServlet("/api/salesPersons/*")
public class SalesPersonsCRUD extends HttpServlet {
    private Gson gson = new Gson();

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            switch (action) {
                case "create":
                    createSalesPerson(request, response);
                    break;
                case "update":
                    updateSalesPerson(request, response);
                    break;
                case "delete":
                    deleteSalesPerson(request, response);
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
            List<Map<String, Object>> salesPersons = MySQLDataStoreUtilities.getRecords("SalesPersons", null);
            response.getWriter().write(gson.toJson(salesPersons));
        } catch (SQLException e) {
            response.getWriter().write(gson.toJson(createErrorResponse("Database error")));
            e.printStackTrace();
        }
    }

    private void createSalesPerson(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        Map<String, Object> salesPersonValues = new HashMap<>();
        salesPersonValues.put("UserID", Integer.parseInt(request.getParameter("userId")));
        salesPersonValues.put("StoreID", Integer.parseInt(request.getParameter("storeId")));

        int salesPersonId = MySQLDataStoreUtilities.insertRecord("SalesPersons", salesPersonValues);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Sales Person created with ID: " + salesPersonId);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private void updateSalesPerson(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int salesPersonId = Integer.parseInt(request.getParameter("salesPersonId"));
        Map<String, Object> salesPersonValues = new HashMap<>();
        salesPersonValues.put("UserID", Integer.parseInt(request.getParameter("userId")));
        salesPersonValues.put("StoreID", Integer.parseInt(request.getParameter("storeId")));

        int rowsAffected = MySQLDataStoreUtilities.updateRecord("SalesPersons", salesPersonValues, "SalesPersonID = " + salesPersonId);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Sales Person updated. Rows affected: " + rowsAffected);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private void deleteSalesPerson(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int salesPersonId = Integer.parseInt(request.getParameter("salesPersonId"));
        int rowsAffected = MySQLDataStoreUtilities.deleteRecord("SalesPersons", "SalesPersonID = " + salesPersonId);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Sales Person deleted. Rows affected: " + rowsAffected);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private JsonObject createErrorResponse(String message) {
        JsonObject errorResponse = new JsonObject();
        errorResponse.addProperty("error", message);
        return errorResponse;
    }
}