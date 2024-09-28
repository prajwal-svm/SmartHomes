import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;
import java.util.*;
import java.sql.SQLException;
import utilities.MySQLDataStoreUtilities;
import utilities.MongoDBDataStoreUtilities;
import com.google.gson.Gson;
import org.bson.Document;

@WebServlet("/trending")
public class TrendingServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private Gson gson = new Gson();

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            Map<String, Object> trendingData = new HashMap<>();
            
            // Fetch top liked products
            List<Map<String, Object>> topLikedProducts = getTopLikedProducts();
            trendingData.put("topLikedProducts", topLikedProducts);
            
            // Fetch top zip codes
            List<Map<String, Object>> topZipCodes = getTopZipCodes();
            trendingData.put("topZipCodes", topZipCodes);
            
            // Fetch top sold products
            List<Map<String, Object>> topSoldProducts = getTopSoldProducts();
            trendingData.put("topSoldProducts", topSoldProducts);

            out.print(gson.toJson(trendingData));
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\": \"An error occurred: " + e.getMessage() + "\"}");
        }
        out.flush();
    }

    private List<Map<String, Object>> getTopLikedProducts() throws SQLException {
        List<Map<String, Object>> allProducts = MySQLDataStoreUtilities.getRecords("Products", null);
        List<Map<String, Object>> allReviews = MongoDBDataStoreUtilities.getAllRecords();
        
        Map<String, List<Integer>> productRatings = new HashMap<>();
        for (Map<String, Object> review : allReviews) {
            String productId = review.get("productId").toString();
            int rating = ((Number) review.get("reviewRating")).intValue();
            productRatings.computeIfAbsent(productId, k -> new ArrayList<>()).add(rating);
        }

        for (Map<String, Object> product : allProducts) {
            String productId = product.get("ProductID").toString();
            List<Integer> ratings = productRatings.get(productId);
            if (ratings != null && !ratings.isEmpty()) {
                double averageRating = ratings.stream().mapToInt(Integer::intValue).average().orElse(0.0);
                product.put("RatingAvg", averageRating);
                product.put("TotalRatings", ratings.size());
            } else {
                product.put("RatingAvg", 0.0);
                product.put("TotalRatings", 0);
            }
        }

        allProducts.sort((p1, p2) -> Double.compare((Double)p2.get("RatingAvg"), (Double)p1.get("RatingAvg")));
        return allProducts.subList(0, Math.min(allProducts.size(), 5));
    }

    private List<Map<String, Object>> getTopZipCodes() throws SQLException {
        List<Map<String, Object>> allTransactions = MySQLDataStoreUtilities.getRecords("Transactions", null);
        Map<String, Integer> zipCodeCounts = new HashMap<>();

        for (Map<String, Object> transaction : allTransactions) {
            String zipCode = (String) transaction.get("ShippingAddressZipCode");
            if (zipCode == null) {
                zipCode = (String) transaction.get("StoreAddressZipCode");
            }
            zipCodeCounts.put(zipCode, zipCodeCounts.getOrDefault(zipCode, 0) + 1);
        }

        return zipCodeCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(5)
            .map(entry -> {
                Map<String, Object> zipCodeData = new HashMap<>();
                zipCodeData.put("ZipCode", entry.getKey());
                zipCodeData.put("ProductsSold", entry.getValue());
                return zipCodeData;
            })
            .collect(java.util.stream.Collectors.toList());
    }

    private List<Map<String, Object>> getTopSoldProducts() throws SQLException {
        List<Map<String, Object>> allTransactions = MySQLDataStoreUtilities.getRecords("Transactions", null);
        Map<Integer, Integer> productSoldCounts = new HashMap<>();

        for (Map<String, Object> transaction : allTransactions) {
            Integer productId = (Integer) transaction.get("ProductID");
            productSoldCounts.put(productId, productSoldCounts.getOrDefault(productId, 0) + 1);
        }

        List<Map.Entry<Integer, Integer>> sortedProducts = new ArrayList<>(productSoldCounts.entrySet());
        sortedProducts.sort((e1, e2) -> e2.getValue().compareTo(e1.getValue()));

        List<Map<String, Object>> result = new ArrayList<>();
        List<Map<String, Object>> allReviews = MongoDBDataStoreUtilities.getAllRecords();
        Map<String, List<Integer>> productRatings = new HashMap<>();
        
        for (Map<String, Object> review : allReviews) {
            String productId = review.get("productId").toString();
            int rating = ((Number) review.get("reviewRating")).intValue();
            productRatings.computeIfAbsent(productId, k -> new ArrayList<>()).add(rating);
        }

        for (int i = 0; i < Math.min(sortedProducts.size(), 5); i++) {
            Integer productId = sortedProducts.get(i).getKey();
            List<Map<String, Object>> productDetails = MySQLDataStoreUtilities.getRecords("Products", "ProductID = " + productId);
            if (!productDetails.isEmpty()) {
                Map<String, Object> product = productDetails.get(0);
                product.put("TotalSold", sortedProducts.get(i).getValue());
                
                List<Integer> ratings = productRatings.get(productId.toString());
                if (ratings != null && !ratings.isEmpty()) {
                    double averageRating = ratings.stream().mapToInt(Integer::intValue).average().orElse(0.0);
                    product.put("RatingAvg", averageRating);
                } else {
                    product.put("RatingAvg", 0.0);
                }
                
                result.add(product);
            }
        }

        return result;
    }
}