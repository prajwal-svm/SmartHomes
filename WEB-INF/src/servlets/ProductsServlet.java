import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;
import java.util.*;
import java.sql.SQLException;
import utilities.MySQLDataStoreUtilities;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import utilities.MongoDBDataStoreUtilities; 
import org.bson.Document; 

@WebServlet("/products/*")
public class ProductsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private Gson gson = new Gson();

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        PrintWriter out = response.getWriter();

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                String typeParam = request.getParameter("type");
                List<Map<String, Object>> products;

                if (typeParam != null && !typeParam.isEmpty()) {
                    products = MySQLDataStoreUtilities.getRecords("Products", "ProductCategory = '" + typeParam + "'");
                } else {
                    products = MySQLDataStoreUtilities.getRecords("Products", null);
                }

                for (Map<String, Object> product : products) {
                    String productId = product.get("ProductID").toString();
                    List<Map<String, Object>> reviews = MongoDBDataStoreUtilities.getRecords(new Document("productId", productId));
                    double ratingSum = 0;
                    int totalRatings = reviews.size();

                    for (Map<String, Object> review : reviews) {
                        Object reviewRating = review.get("reviewRating");
                        if (reviewRating instanceof Number) {
                            ratingSum += ((Number) reviewRating).doubleValue();
                        }
                    }

                    double ratingAvg = totalRatings > 0 ? ratingSum / totalRatings : 0;
                    product.put("RatingAvg", ratingAvg);
                    product.put("TotalRatings", totalRatings);

                    // Fetch accessories for the product
                    List<Map<String, Object>> accessories = MySQLDataStoreUtilities.getRecords("ProductAccessories", "ProductID = " + productId);
                    product.put("Accessories", accessories);
                }

                out.print(gson.toJson(products));
            } else {
                String[] splits = pathInfo.split("/");
                if (splits.length == 2) {
                    int productId = Integer.parseInt(splits[1]);
                    List<Map<String, Object>> products = MySQLDataStoreUtilities.getRecords("Products", "ProductID = " + productId);
                    if (!products.isEmpty()) {
                        // Fetch accessories for the specific product
                        Map<String, Object> product = products.get(0);
                        List<Map<String, Object>> accessories = MySQLDataStoreUtilities.getRecords("ProductAccessories", "ProductID = " + productId);
                        product.put("Accessories", accessories);
                        out.print(gson.toJson(product));
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\": \"Product not found\"}");
                    }
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"error\": \"Invalid request\"}");
                }
            }
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\": \"Database error: " + e.getMessage() + "\"}");
        }
        out.flush();
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        BufferedReader reader = request.getReader();
        Map<String, Object> newProduct = gson.fromJson(reader, new TypeToken<Map<String, Object>>(){}.getType());

        PrintWriter out = response.getWriter();
        try {
            int productId = MySQLDataStoreUtilities.insertRecord("Products", newProduct);
            newProduct.put("ProductID", productId);
            out.print(gson.toJson(newProduct));
            response.setStatus(HttpServletResponse.SC_CREATED);
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\": \"Database error: " + e.getMessage() + "\"}");
        }
        out.flush();
    }

    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        PrintWriter out = response.getWriter();

        if (pathInfo == null || pathInfo.equals("/")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"error\": \"Product ID is required\"}");
        } else {
            String[] splits = pathInfo.split("/");
            if (splits.length == 2) {
                int productId = Integer.parseInt(splits[1]);
                BufferedReader reader = request.getReader();
                Map<String, Object> updatedProduct = gson.fromJson(reader, new TypeToken<Map<String, Object>>(){}.getType());

                try {
                    int rowsAffected = MySQLDataStoreUtilities.updateRecord("Products", updatedProduct, "ProductID = " + productId);
                    if (rowsAffected > 0) {
                        List<Map<String, Object>> products = MySQLDataStoreUtilities.getRecords("Products", "ProductID = " + productId);
                        out.print(gson.toJson(products.get(0)));
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\": \"Product not found\"}");
                    }
                } catch (SQLException e) {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"error\": \"Database error: " + e.getMessage() + "\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Invalid request\"}");
            }
        }
        out.flush();
    }

    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        PrintWriter out = response.getWriter();

        if (pathInfo == null || pathInfo.equals("/")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"error\": \"Product ID is required\"}");
        } else {
            String[] splits = pathInfo.split("/");
            if (splits.length == 2) {
                int productId = Integer.parseInt(splits[1]);
                try {
                    int rowsAffected = MySQLDataStoreUtilities.deleteRecord("Products", "ProductID = " + productId);
                    if (rowsAffected > 0) {
                        out.print("{\"message\": \"Product deleted successfully\"}");
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\": \"Product not found\"}");
                    }
                } catch (SQLException e) {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"error\": \"Database error: " + e.getMessage() + "\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Invalid request\"}");
            }
        }
        out.flush();
    }
}