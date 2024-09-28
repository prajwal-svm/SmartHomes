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

@WebServlet("/api/products/*")
public class ProductsCRUD extends HttpServlet {
    private Gson gson = new Gson();

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            switch (action) {
                case "create":
                    createProduct(request, response);
                    break;
                case "update":
                    updateProduct(request, response);
                    break;
                case "delete":
                    deleteProduct(request, response);
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
            List<Map<String, Object>> products = MySQLDataStoreUtilities.getRecords("Products", null);
            response.getWriter().write(gson.toJson(products));
        } catch (SQLException e) {
            response.getWriter().write(gson.toJson(createErrorResponse("Database error")));
            e.printStackTrace();
        }
    }

    private void createProduct(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        Map<String, Object> productValues = new HashMap<>();
        productValues.put("ProductModelName", request.getParameter("productModelName"));
        productValues.put("ProductCategory", request.getParameter("productCategory"));
        productValues.put("ProductPrice", Double.parseDouble(request.getParameter("productPrice")));
        productValues.put("ProductOnSale", Boolean.parseBoolean(request.getParameter("productOnSale")));
        productValues.put("ManufacturerName", request.getParameter("manufacturerName"));
        productValues.put("ManufacturerRebate", Boolean.parseBoolean(request.getParameter("manufacturerRebate")));
        productValues.put("Inventory", Integer.parseInt(request.getParameter("inventory")));
        productValues.put("ProductImage", request.getParameter("productImage"));
        productValues.put("ProductDescription", request.getParameter("productDescription"));

        int productId = MySQLDataStoreUtilities.insertRecord("Products", productValues);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Product created with ID: " + productId);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private void updateProduct(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int productId = Integer.parseInt(request.getParameter("productId"));
        Map<String, Object> productValues = new HashMap<>();
        productValues.put("ProductModelName", request.getParameter("productModelName"));
        productValues.put("ProductCategory", request.getParameter("productCategory"));
        productValues.put("ProductPrice", Double.parseDouble(request.getParameter("productPrice")));
        productValues.put("ProductOnSale", Boolean.parseBoolean(request.getParameter("productOnSale")));
        productValues.put("ManufacturerName", request.getParameter("manufacturerName"));
        productValues.put("ManufacturerRebate", Boolean.parseBoolean(request.getParameter("manufacturerRebate")));
        productValues.put("Inventory", Integer.parseInt(request.getParameter("inventory")));
        productValues.put("ProductImage", request.getParameter("productImage"));
        productValues.put("ProductDescription", request.getParameter("productDescription"));

        int rowsAffected = MySQLDataStoreUtilities.updateRecord("Products", productValues, "ProductID = " + productId);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Product updated. Rows affected: " + rowsAffected);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private void deleteProduct(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {
        int productId = Integer.parseInt(request.getParameter("productId"));
        int rowsAffected = MySQLDataStoreUtilities.deleteRecord("Products", "ProductID = " + productId);
        JsonObject responseJson = new JsonObject();
        responseJson.addProperty("message", "Product deleted. Rows affected: " + rowsAffected);
        response.getWriter().write(gson.toJson(responseJson));
    }

    private JsonObject createErrorResponse(String message) {
        JsonObject errorResponse = new JsonObject();
        errorResponse.addProperty("error", message);
        return errorResponse;
    }
}