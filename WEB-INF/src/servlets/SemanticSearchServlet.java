package servlets;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.util.*;
import com.google.gson.Gson;
import java.util.stream.Collectors;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import org.apache.http.HttpHost;
import org.apache.http.HttpEntity;
import org.apache.http.message.BasicHeader;
import org.apache.http.HttpHeaders;
import org.apache.http.Header;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.Response;

@WebServlet("/api/ai/*")
public class SemanticSearchServlet extends HttpServlet {
   private Gson gson = new Gson();
    private static final String OPENAI_API_KEY = "sk-dev-********";
    private static final String ELASTIC_API_KEY = "********";
   private RestClient client;

   @Override
   public void init() throws ServletException {
       client = RestClient.builder(
           new HttpHost("1a9b3798720947d19fb8939e78cf2473.us-west-1.aws.found.io", 443, "https")
       )
       .setDefaultHeaders(new Header[]{
           new BasicHeader(HttpHeaders.AUTHORIZATION, "ApiKey " + ELASTIC_API_KEY)
       })
       .build();
   }

   @Override
   protected void doPost(HttpServletRequest request, HttpServletResponse response) 
           throws ServletException, IOException {
       response.setContentType("application/json");
       response.setCharacterEncoding("UTF-8");
       PrintWriter out = response.getWriter();

       try {
           String pathInfo = request.getPathInfo();
           String body = request.getReader().lines().collect(Collectors.joining());
           Map<String, String> requestData = gson.fromJson(body, Map.class);
           String query = requestData.get("query");

           if (query == null || query.trim().isEmpty()) {
               response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
               out.print(gson.toJson(Map.of("error", "Query is required")));
               return;
           }

           // Generate embedding for query text
           float[] queryEmbedding = getEmbedding(query);

           String result;
           if ("/products".equals(pathInfo)) {
               result = searchProducts(queryEmbedding);
           } else if ("/reviews".equals(pathInfo)) {
               result = searchReviews(queryEmbedding);
           } else {
               response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
               out.print(gson.toJson(Map.of("error", "Invalid endpoint")));
               return;
           }

           // Parse and format Elasticsearch response
           Map<String, Object> esResponse = gson.fromJson(result, Map.class);
           Map<String, Object> hits = (Map<String, Object>) esResponse.get("hits");
           List<Map<String, Object>> results = new ArrayList<>();
           
           if (hits != null) {
               List<Map<String, Object>> hitsList = (List<Map<String, Object>>) hits.get("hits");
               for (Map<String, Object> hit : hitsList) {
                   double score = ((Number) hit.get("_score")).doubleValue();
                   Map<String, Object> source = (Map<String, Object>) hit.get("_source");
                   
                   // Create flattened result with source data and similarity score
                   Map<String, Object> result_item = new HashMap<>();
                   result_item.put("similarity_score", score);
                   
                   // Add productId
                   result_item.put("productId", source.get("productId"));
                   
                   // Add all fields from productInfo/reviewInfo
                   Map<String, Object> info = (Map<String, Object>) source.get(
                       "/products".equals(pathInfo) ? "productInfo" : "reviewInfo"
                   );
                   if (info != null) {
                       result_item.putAll(info);
                   }
                   
                   results.add(result_item);
               }
           }

           // Sort results by similarity score
           results.sort((a, b) -> Double.compare(
               (Double) b.get("similarity_score"), 
               (Double) a.get("similarity_score")
           ));

           Map<String, Object> response_data = new HashMap<>();
           response_data.put("query", query);
           response_data.put("results", results);
           response_data.put("total_results", results.size());

           out.print(gson.toJson(response_data));

       } catch (Exception e) {
           e.printStackTrace();
           response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
           out.print(gson.toJson(Map.of(
               "error", e.getMessage(),
               "details", e.getClass().getName()
           )));
       }
   }

   private float[] getEmbedding(String text) throws IOException {
       Map<String, Object> requestBody = new HashMap<>();
       requestBody.put("model", "text-embedding-3-small");
       requestBody.put("input", text);
       
       URL url = new URL("https://api.openai.com/v1/embeddings");
       HttpURLConnection conn = (HttpURLConnection) url.openConnection();
       conn.setRequestMethod("POST");
       conn.setRequestProperty("Content-Type", "application/json");
       conn.setRequestProperty("Authorization", "Bearer " + OPENAI_API_KEY);
       conn.setDoOutput(true);

       try (OutputStream os = conn.getOutputStream()) {
           byte[] input = gson.toJson(requestBody).getBytes(StandardCharsets.UTF_8);
           os.write(input, 0, input.length);
       }

       try (BufferedReader br = new BufferedReader(
               new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
           StringBuilder response = new StringBuilder();
           String responseLine;
           while ((responseLine = br.readLine()) != null) {
               response.append(responseLine.trim());
           }
           
           Map<String, Object> responseMap = gson.fromJson(response.toString(), Map.class);
           List<Map<String, Object>> data = (List<Map<String, Object>>) responseMap.get("data");
           List<Double> embedding = (List<Double>) data.get(0).get("embedding");
           
           float[] embeddingArray = new float[embedding.size()];
           for (int i = 0; i < embedding.size(); i++) {
               embeddingArray[i] = embedding.get(i).floatValue();
           }
           return embeddingArray;
       }
   }

   private String searchProducts(float[] queryEmbedding) throws IOException {
       // Create Elasticsearch query with cosine similarity
       String requestBody = String.format(
           "{" +
           "  \"query\": {" +
           "    \"script_score\": {" +
           "      \"query\": {\"match_all\": {}}," +
           "      \"script\": {" +
           "        \"source\": \"cosineSimilarity(params.query_vector, 'embedding') + 1.0\"," +
           "        \"params\": {\"query_vector\": %s}" +
           "      }" +
           "    }" +
           "  }," +
           "  \"size\": 10," +
           "  \"_source\": true," +
           "  \"min_score\": 0.6" + // Filter out low similarity matches
           "}",
           gson.toJson(queryEmbedding)
       );

       Request request = new Request("GET", "/product_embeddings/_search");
       request.setJsonEntity(requestBody);
       Response response = client.performRequest(request);
       
       // Read response
       InputStream content = response.getEntity().getContent();
       BufferedReader reader = new BufferedReader(new InputStreamReader(content, StandardCharsets.UTF_8));
       StringBuilder sb = new StringBuilder();
       String line;
       while ((line = reader.readLine()) != null) {
           sb.append(line);
       }
       return sb.toString();
   }

   private String searchReviews(float[] queryEmbedding) throws IOException {
       // Create Elasticsearch query with cosine similarity
       String requestBody = String.format(
           "{" +
           "  \"query\": {" +
           "    \"script_score\": {" +
           "      \"query\": {\"match_all\": {}}," +
           "      \"script\": {" +
           "        \"source\": \"cosineSimilarity(params.query_vector, 'embedding') + 1.0\"," +
           "        \"params\": {\"query_vector\": %s}" +
           "      }" +
           "    }" +
           "  }," +
           "  \"size\": 10," +
           "  \"_source\": true," +
           "  \"min_score\": 0.6" + // Filter out low similarity matches
           "}",
           gson.toJson(queryEmbedding)
       );

       Request request = new Request("GET", "/product_reviews_embeddings/_search");
       request.setJsonEntity(requestBody);
       Response response = client.performRequest(request);
       
       // Read response
       InputStream content = response.getEntity().getContent();
       BufferedReader reader = new BufferedReader(new InputStreamReader(content, StandardCharsets.UTF_8));
       StringBuilder sb = new StringBuilder();
       String line;
       while ((line = reader.readLine()) != null) {
           sb.append(line);
       }
       return sb.toString();
   }

   @Override
   public void destroy() {
       try {
           if (client != null) {
               client.close();
           }
       } catch (IOException e) {
           e.printStackTrace();
       }
   }
}