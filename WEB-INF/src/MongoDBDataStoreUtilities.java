package utilities;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class MongoDBDataStoreUtilities {
    private static final String MONGO_URI = "mongodb://localhost:27017";
    private static final String DB_NAME = "smarthomes";
    private static final String COLLECTION_NAME = "productReviews";

    private static MongoCollection<Document> getCollection() {
        MongoClient mongoClient = MongoClients.create(MONGO_URI);
        MongoDatabase database = mongoClient.getDatabase(DB_NAME);
        return database.getCollection(COLLECTION_NAME);
    }

    public static void insertRecord(Map<String, Object> reviewData) {
        MongoCollection<Document> collection = getCollection();
        Document doc = new Document(reviewData);
        collection.insertOne(doc);
    }

    public static void updateRecord(String reviewId, Map<String, Object> updateFields) {
        MongoCollection<Document> collection = getCollection();
        Document query = new Document("reviewID", reviewId);
        Document update = new Document("$set", new Document(updateFields));
        collection.updateOne(query, update);
    }

    public static void deleteRecord(String reviewId) {
        MongoCollection<Document> collection = getCollection();
        Document query = new Document("reviewID", reviewId);
        collection.deleteOne(query);
    }

    public static List<Map<String, Object>> getRecords(Map<String, Object> queryFilter) {
        MongoCollection<Document> collection = getCollection();
        Document query = new Document(queryFilter);
        List<Map<String, Object>> results = new ArrayList<>();
        for (Document doc : collection.find(query)) {
            results.add(doc);
        }
        return results;
    }

    public static List<Map<String, Object>> getAllRecords() {
        MongoCollection<Document> collection = getCollection();
        List<Map<String, Object>> results = new ArrayList<>();
        for (Document doc : collection.find()) {
            results.add(doc);
        }
        return results;
    }
}