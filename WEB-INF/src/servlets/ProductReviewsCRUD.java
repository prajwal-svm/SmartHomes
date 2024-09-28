package servlets;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.util.*;
import java.math.BigDecimal;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.bson.types.Decimal128;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.result.InsertOneResult;
import com.mongodb.client.result.UpdateResult;
import com.mongodb.client.result.DeleteResult;

@WebServlet("/api/productReviews/*")
public class ProductReviewsCRUD extends HttpServlet {
    private Gson gson = new Gson();
    private MongoClient mongoClient;
    private MongoDatabase database;
    private MongoCollection<Document> productReviewsCollection;

    @Override
    public void init() throws ServletException {
        mongoClient = MongoClients.create("mongodb://localhost:27017");
        database = mongoClient.getDatabase("smarthomes");
        productReviewsCollection = database.getCollection("productReviews");
    }

    @Override
    public void destroy() {
        if (mongoClient != null) {
            mongoClient.close();
        }
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");

        try {
            switch (action) {
                case "create":
                    out.print(createProductReview(request));
                    break;
                case "update":
                    out.print(updateProductReview(request));
                    break;
                case "delete":
                    out.print(deleteProductReview(request));
                    break;
                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print(gson.toJson(Map.of("error", "Invalid action")));
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print(gson.toJson(Map.of("error", "Database error: " + e.getMessage())));
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            List<Document> reviews = productReviewsCollection.find().into(new ArrayList<>());
            out.print(gson.toJson(Map.of("productReviews", reviews)));
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print(gson.toJson(Map.of("error", "Database error: " + e.getMessage())));
        }
    }

    private String createProductReview(HttpServletRequest request) throws IOException {
        JsonObject jsonObject = readJsonFromRequest(request);

        Document review = new Document()
            .append("productId", getStringOrNull(jsonObject, "productId"))
            .append("productModelName", getStringOrNull(jsonObject, "productModelName"))
            .append("productCategory", getStringOrNull(jsonObject, "productCategory"))
            .append("productPrice", getDecimal128OrNull(jsonObject, "productPrice"))
            .append("storeID", getStringOrNull(jsonObject, "storeID"))
            .append("storeZip", getStringOrNull(jsonObject, "storeZip"))
            .append("storeCity", getStringOrNull(jsonObject, "storeCity"))
            .append("storeState", getStringOrNull(jsonObject, "storeState"))
            .append("productOnSale", getBooleanOrNull(jsonObject, "productOnSale"))
            .append("manufacturerName", getStringOrNull(jsonObject, "manufacturerName"))
            .append("manufacturerRebate", getBooleanOrNull(jsonObject, "manufacturerRebate"))
            .append("userID", getStringOrNull(jsonObject, "userID"))
            .append("userAge", getIntegerOrNull(jsonObject, "userAge"))
            .append("userGender", getStringOrNull(jsonObject, "userGender"))
            .append("userOccupation", getStringOrNull(jsonObject, "userOccupation"))
            .append("reviewRating", getIntegerOrNull(jsonObject, "reviewRating"))
            .append("reviewDate", new Date())
            .append("reviewText", getStringOrNull(jsonObject, "reviewText"));

        InsertOneResult result = productReviewsCollection.insertOne(review);
        return gson.toJson(Map.of("message", "Product review created successfully", "insertedId", result.getInsertedId()));
    }

    private String updateProductReview(HttpServletRequest request) throws IOException {
        JsonObject jsonObject = readJsonFromRequest(request);
        String reviewId = getStringOrNull(jsonObject, "reviewId");

        if (reviewId == null) {
            throw new IllegalArgumentException("Review ID is required for update operation");
        }

        Document update = new Document()
            .append("productId", getStringOrNull(jsonObject, "productId"))
            .append("productModelName", getStringOrNull(jsonObject, "productModelName"))
            .append("productCategory", getStringOrNull(jsonObject, "productCategory"))
            .append("productPrice", getDecimal128OrNull(jsonObject, "productPrice"))
            .append("storeID", getStringOrNull(jsonObject, "storeID"))
            .append("storeZip", getStringOrNull(jsonObject, "storeZip"))
            .append("storeCity", getStringOrNull(jsonObject, "storeCity"))
            .append("storeState", getStringOrNull(jsonObject, "storeState"))
            .append("productOnSale", getBooleanOrNull(jsonObject, "productOnSale"))
            .append("manufacturerName", getStringOrNull(jsonObject, "manufacturerName"))
            .append("manufacturerRebate", getBooleanOrNull(jsonObject, "manufacturerRebate"))
            .append("userID", getStringOrNull(jsonObject, "userID"))
            .append("userAge", getIntegerOrNull(jsonObject, "userAge"))
            .append("userGender", getStringOrNull(jsonObject, "userGender"))
            .append("userOccupation", getStringOrNull(jsonObject, "userOccupation"))
            .append("reviewRating", getIntegerOrNull(jsonObject, "reviewRating"))
            .append("reviewText", getStringOrNull(jsonObject, "reviewText"));

        UpdateResult result = productReviewsCollection.updateOne(
            Filters.eq("_id", new ObjectId(reviewId)),
            new Document("$set", update)
        );

        return gson.toJson(Map.of("message", "Product review updated successfully", "modifiedCount", result.getModifiedCount()));
    }

    private String deleteProductReview(HttpServletRequest request) throws IOException {
        JsonObject jsonObject = readJsonFromRequest(request);
        String reviewId = getStringOrNull(jsonObject, "reviewId");

        if (reviewId == null) {
            throw new IllegalArgumentException("Review ID is required for delete operation");
        }

        DeleteResult result = productReviewsCollection.deleteOne(Filters.eq("_id", new ObjectId(reviewId)));
        return gson.toJson(Map.of("message", "Product review deleted successfully", "deletedCount", result.getDeletedCount()));
    }

    private JsonObject readJsonFromRequest(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        return gson.fromJson(sb.toString(), JsonObject.class);
    }

    private String getStringOrNull(JsonObject json, String key) {
        if (json.has(key) && !json.get(key).isJsonNull()) {
            return json.get(key).getAsString();
        }
        return null;
    }

    private Decimal128 getDecimal128OrNull(JsonObject json, String key) {
        if (json.has(key) && !json.get(key).isJsonNull()) {
            double value = json.get(key).getAsDouble();
            return new Decimal128(new BigDecimal(String.valueOf(value)));
        }
        return null;
    }

    private Boolean getBooleanOrNull(JsonObject json, String key) {
        return json.has(key) && !json.get(key).isJsonNull() ? json.get(key).getAsBoolean() : null;
    }

    private Integer getIntegerOrNull(JsonObject json, String key) {
        return json.has(key) && !json.get(key).isJsonNull() ? json.get(key).getAsInt() : null;
    }
}