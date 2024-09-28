package tests;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;

public class CRUDGetTests {
    private static final String BASE_URL = "http://localhost:8080/SmartHomes";
    private static int totalTests = 0;

    public static void main(String[] args) {
        int passedTests = 0;

        passedTests += runTest("Users GET", "/api/users", 200);
        passedTests += runTest("Users GET by ID", "/api/users/1", 200);

        passedTests += runTest("Stores GET", "/api/stores", 200);
        passedTests += runTest("Stores GET by ID", "/api/stores/1", 200);

        passedTests += runTest("Products GET", "/api/products", 200);
        passedTests += runTest("Products GET by ID", "/api/products/1", 200);

        passedTests += runTest("Customers GET", "/api/customers", 200);
        passedTests += runTest("Customers GET by ID", "/api/customers/1", 200);

        passedTests += runTest("Transactions GET", "/api/transactions", 200);
        passedTests += runTest("Transactions GET by ID", "/api/transactions/1", 200);

        passedTests += runTest("Sales Persons GET", "/api/salesPersons", 200);
        passedTests += runTest("Sales Persons GET by ID", "/api/salesPersons/1", 200);

        passedTests += runTest("Store Managers GET", "/api/storeManagers", 200);
        passedTests += runTest("Store Managers GET by ID", "/api/storeManagers/1", 200);
        
        passedTests += runTest("Product Reviews GET", "/api/productReviews", 200);
        passedTests += runTest("Product Reviews GET by ID", "/api/productReviews/1", 200);

        System.out.println("🧪 Total Tests: " + totalTests);
        System.out.println("✅ Passed: " + passedTests);
        System.out.println("❌ Failed: " + (totalTests - passedTests));
        System.out.printf("🎯 Pass Rate: %.2f%%\n", (passedTests / (double) totalTests) * 100);
    }

    private static int runTest(String testName, String endpoint, int expectedStatus) {
        System.out.println("Testing " + testName + ":");
        totalTests += 1;
        int passed = 0;
        try {
            URL url = new URI(BASE_URL + endpoint).toURL();
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("GET");

            int status = con.getResponseCode();
            if (status != expectedStatus) {
                System.out.println("❌: Expected status " + expectedStatus + " but got " + status);
            } else {
                System.out.println("✅: " + testName + " - Status: " + status);
                passed += 1; 
            }

            BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
            String inputLine;
            StringBuilder content = new StringBuilder();
            while ((inputLine = in.readLine()) != null) {
                content.append(inputLine);
            }
            in.close();

            System.out.println("Response: " + content.toString().substring(0, Math.min(content.length(), 100)) + "...\n");
            con.disconnect();
        } catch (Exception e) {
            System.out.println("Error testing " + testName + ": " + e.getMessage() + "\n");
        } finally {
            return passed; 
        }
    }
}
