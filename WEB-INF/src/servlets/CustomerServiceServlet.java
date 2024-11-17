package servlets;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.sql.*;
import java.util.*;
import utilities.MySQLDataStoreUtilities;
import com.google.gson.Gson;
import java.util.stream.Collectors;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@WebServlet("/api/customer-service/*")
@MultipartConfig
public class CustomerServiceServlet extends HttpServlet {
    private Gson gson = new Gson();
    private static final String OPENAI_API_KEY = "sk-dev-xxx";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            String ticketId = request.getParameter("ticketId");
            if (ticketId != null) {
                List<Map<String, Object>> tickets = MySQLDataStoreUtilities.getRecords(
                    "CustomerServiceTickets", 
                    "TicketID = " + ticketId.replace("TKT-", "")
                );

                if (tickets.isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print(gson.toJson(Map.of("error", "Ticket not found")));
                } else {
                    out.print(gson.toJson(tickets.get(0)));
                }
            } else {
                List<Map<String, Object>> tickets = MySQLDataStoreUtilities.getRecords("CustomerServiceTickets", null);
                out.print(gson.toJson(Map.of("tickets", tickets)));
            }
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print(gson.toJson(Map.of("error", e.getMessage())));
        }
    }

    private void handleCheckStatus(HttpServletRequest request, HttpServletResponse response) 
        throws ServletException, IOException, SQLException {
        String body = request.getReader().lines().collect(Collectors.joining());
        Map<String, String> requestData = gson.fromJson(body, Map.class);
        String ticketNumber = requestData.get("ticketNumber");

        List<Map<String, Object>> tickets = MySQLDataStoreUtilities.getRecords(
            "CustomerServiceTickets", 
            "TicketID = " + ticketNumber.replace("TKT-", "")
        );

        PrintWriter out = response.getWriter();
        if (tickets.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            out.print(gson.toJson(Map.of("error", "Ticket not found")));
            return;
        }

        Map<String, Object> ticket = tickets.get(0);
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("ticketNumber", ticketNumber);
        responseData.put("status", ticket.get("Status"));
        responseData.put("decision", ticket.get("AIDecision"));
        responseData.put("createdDate", ticket.get("CreatedDate"));
        responseData.put("description", ticket.get("Description"));

        out.print(gson.toJson(responseData));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            String pathInfo = request.getPathInfo();
            if ("/open-ticket".equals(pathInfo)) {
                String contentType = request.getContentType();
                if (contentType != null && contentType.startsWith("multipart/form-data")) {
                    handleMultipartTicket(request, response);
                } else {
                    handleJsonTicket(request, response);
                }
            } else if ("/check-status".equals(pathInfo)) {
                handleCheckStatus(request, response);
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print(gson.toJson(Map.of("error", "Invalid endpoint")));
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print(gson.toJson(Map.of("error", e.getMessage())));
        }
    }

    private void handleJsonTicket(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException, SQLException {
        String body = request.getReader().lines().collect(Collectors.joining());
        Map<String, String> ticketData = gson.fromJson(body, Map.class);
        
        String description = ticketData.get("ticketText");
        String imageUrl = ticketData.get("imageUrl");
        String orderId = ticketData.get("orderId");

        List<Map<String, Object>> transactions = MySQLDataStoreUtilities.getRecords(
            "Transactions", 
            "OrderID = '" + orderId + "'"
        );
        
        if (transactions.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.getWriter().print(gson.toJson(Map.of("error", "Order not found")));
            return;
        }
        
        int transactionId = ((Number) transactions.get(0).get("TransactionID")).intValue();
        int customerId = ((Number) transactions.get(0).get("CustomerID")).intValue();

        String base64Image = null;
        if (imageUrl != null && imageUrl.startsWith("data:image")) {
            base64Image = imageUrl.split(",")[1]; // Extract base64 from data URL
        }

        String aiDecision = getAIDecision(base64Image, description);

        Map<String, Object> ticketValues = new HashMap<>();
        ticketValues.put("TransactionID", transactionId);
        ticketValues.put("CustomerID", customerId);
        ticketValues.put("Description", description);
        ticketValues.put("ImageURL", imageUrl);
        ticketValues.put("Status", "Pending");
        ticketValues.put("CreatedDate", new Timestamp(System.currentTimeMillis()));
        ticketValues.put("AIDecision", aiDecision);

        int ticketId = MySQLDataStoreUtilities.insertRecord("CustomerServiceTickets", ticketValues);
        String formattedTicketId = String.format("TKT-%06d", ticketId);
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("ticketNumber", formattedTicketId);
        responseData.put("initialDecision", aiDecision);
        response.getWriter().print(gson.toJson(responseData));
    }

    private void handleMultipartTicket(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException, SQLException {
        Part imagePart = request.getPart("image");
        String description = request.getParameter("ticketText");
        String orderId = request.getParameter("orderId");

        List<Map<String, Object>> transactions = MySQLDataStoreUtilities.getRecords(
            "Transactions", 
            "OrderID = '" + orderId + "'"
        );
        
        if (transactions.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.getWriter().print(gson.toJson(Map.of("error", "Order not found")));
            return;
        }
        
        int transactionId = ((Number) transactions.get(0).get("TransactionID")).intValue();
        int customerId = ((Number) transactions.get(0).get("CustomerID")).intValue();

        String base64Image = convertImageToBase64(imagePart);
        
        String aiDecision = getAIDecision(base64Image, description);

        Map<String, Object> ticketValues = new HashMap<>();
        ticketValues.put("TransactionID", transactionId);
        ticketValues.put("CustomerID", customerId);
        ticketValues.put("Description", description);
        ticketValues.put("ImageURL", imagePart.getSubmittedFileName());
        ticketValues.put("Status", "Pending");
        ticketValues.put("CreatedDate", new Timestamp(System.currentTimeMillis()));
        ticketValues.put("AIDecision", aiDecision);

        int ticketId = MySQLDataStoreUtilities.insertRecord("CustomerServiceTickets", ticketValues);
        String formattedTicketId = String.format("TKT-%06d", ticketId);
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("ticketNumber", formattedTicketId);
        responseData.put("initialDecision", aiDecision);
        response.getWriter().print(gson.toJson(responseData));
    }

    // Converts image Part to base64 string
    private String convertImageToBase64(Part imagePart) throws IOException {
        try (InputStream inputStream = imagePart.getInputStream()) {
            byte[] imageBytes = inputStream.readAllBytes();
            return Base64.getEncoder().encodeToString(imageBytes);
        }
    }

    private String getAIDecision(String base64Image, String description) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o-mini");  
            requestBody.put("messages", Arrays.asList(
                Map.of("role", "user", "content", String.format(
                    "Analyze the following package delivery case to determine appropriate action.\n\n" +
                    "1. First, examine the base64 image: %s\n" +
                    "   - If the image shows visible damage to package/product, proceed to step 2\n" +
                    "   - If the image shows intact package/product, return '3' (Escalate to Human Agent)\n\n" +
                    "2. If damage detected, analyze customer description: %s\n" +
                    "   - If description mentions refund request/preference, return '1' (Refund Order)\n" +
                    "   - Otherwise return '2' (Replace Order)\n\n" +
                    "Return only a single digit response:\n" +
                    "1 = Refund Order\n" +
                    "2 = Replace Order\n" +
                    "3 = Escalate to Human Agent",
                    base64Image, description
                ))
            ));

            URL url = new URL("https://api.openai.com/v1/chat/completions");
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
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                String decision = ((String) message.get("content")).trim();

                // Log decision
                System.out.println("\n\nDecision: " + decision);

                switch (decision) {
                    case "1": return "Refund Order";
                    case "2": return "Replace Order";
                    case "3": return "Escalate to Human Agent";
                    default: return "Escalate to Human Agent";
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Escalate to Human Agent";
        }
    }

    private String saveBase64Image(String base64Url) throws IOException {
        String base64Image = base64Url.split(",")[1];
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);
        
        String fileName = System.currentTimeMillis() + ".jpg";
        String uploadDir = getServletContext().getRealPath("/uploads");
        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.exists()) {
            uploadDirFile.mkdirs();
        }
        
        String filePath = uploadDir + File.separator + fileName;
        try (FileOutputStream fos = new FileOutputStream(filePath)) {
            fos.write(imageBytes);
        }
        
        return fileName;
    }
}