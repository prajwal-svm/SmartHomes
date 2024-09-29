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

@WebServlet("/insights")
public class InsightsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private Gson gson = new Gson();

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            Map<String, Object> insightsData = new HashMap<>();
            
            // Fetch adoption rate data
            List<Map<String, Object>> adoptionRate = getAdoptionRate();
            insightsData.put("adoptionRate", adoptionRate);
            
            // Fetch category ratings data
            List<Map<String, Object>> categoryRatings = getCategoryRatings();
            insightsData.put("categoryRatings", categoryRatings);

            out.print(gson.toJson(insightsData));
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\": \"An error occurred: " + e.getMessage() + "\"}");
        }
        out.flush();
    }

    private List<Map<String, Object>> getAdoptionRate() throws SQLException {
        List<Map<String, Object>> adoptionRate = new ArrayList<>();
        
        // This is a mock implementation. In a real scenario, you would query your database
        // to get the actual adoption rate data over the years.
        int currentYear = Calendar.getInstance().get(Calendar.YEAR);
        for (int i = 0; i < 5; i++) {
            Map<String, Object> yearData = new HashMap<>();
            yearData.put("year", currentYear - i);
            yearData.put("rate", 20 + (i * 15)); // Mock increasing adoption rate
            adoptionRate.add(yearData);
        }
        
        return adoptionRate;
    }

    private List<Map<String, Object>> getCategoryRatings() throws SQLException {
        List<Map<String, Object>> categoryRatings = new ArrayList<>();
        
        // Get all product reviews from MongoDB
        List<Map<String, Object>> allReviews = MongoDBDataStoreUtilities.getAllRecords();
        
        // Calculate average rating and user count for each category
        Map<String, List<Integer>> categoryRatingsMap = new HashMap<>();
        Map<String, Set<String>> categoryUsersMap = new HashMap<>();
        
        for (Map<String, Object> review : allReviews) {
            String category = (String) review.get("productCategory");
            int rating = (int) review.get("reviewRating");
            String userId = (String) review.get("userID");
            
            categoryRatingsMap.computeIfAbsent(category, k -> new ArrayList<>()).add(rating);
            categoryUsersMap.computeIfAbsent(category, k -> new HashSet<>()).add(userId);
        }
        
        for (String category : categoryRatingsMap.keySet()) {
            Map<String, Object> categoryData = new HashMap<>();
            List<Integer> ratings = categoryRatingsMap.get(category);
            double averageRating = ratings.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            int userCount = categoryUsersMap.get(category).size();
            
            categoryData.put("category", category);
            categoryData.put("rating", Math.round(averageRating * 10.0) / 10.0); // Round to one decimal place
            categoryData.put("userCount", userCount);
            
            categoryRatings.add(categoryData);
        }
        
        return categoryRatings;
    }
}