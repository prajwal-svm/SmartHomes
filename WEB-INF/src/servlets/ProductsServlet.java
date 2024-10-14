import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;
import java.util.*;
import java.sql.*;
import utilities.MySQLDataStoreUtilities;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import utilities.MongoDBDataStoreUtilities; 
import org.bson.Document;
import javax.xml.parsers.*;
import javax.xml.transform.*;
import javax.xml.transform.dom.*;
import javax.xml.transform.stream.*;
import org.w3c.dom.*;

@WebServlet("/products/*")
public class ProductsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private Gson gson = new Gson();
    private String xmlFilePath;

    @Override
    public void init() throws ServletException {
        super.init();
        xmlFilePath = getServletContext().getRealPath("/WEB-INF/ProductCatalog.xml");
    }

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

                    List<Map<String, Object>> accessories = MySQLDataStoreUtilities.getRecords("ProductAccessories", "ProductID = " + productId);
                    product.put("Accessories", accessories);
                }

                out.print(gson.toJson(products));
            } else if (pathInfo.equals("/inventory")) {
                handleInventoryRequest(response);
            } else if (pathInfo.equals("/sales-report")) {
                handleSalesReportRequest(response);
            } else {
                String[] splits = pathInfo.split("/");
                if (splits.length == 2) {
                    int productId = Integer.parseInt(splits[1]);
                    List<Map<String, Object>> products = MySQLDataStoreUtilities.getRecords("Products", "ProductID = " + productId);
                    if (!products.isEmpty()) {
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

    private void handleInventoryRequest(HttpServletResponse response) throws SQLException, IOException {
        PrintWriter out = response.getWriter();
        Map<String, Object> inventoryData = new HashMap<>();

        List<Map<String, Object>> allProducts = MySQLDataStoreUtilities.getRecords("Products", null);
        inventoryData.put("allProducts", filterProductsForInventory(allProducts));

        List<Map<String, Object>> productsOnSale = MySQLDataStoreUtilities.getRecords("Products", "ProductOnSale = true");
        inventoryData.put("productsOnSale", filterProductsForInventory(productsOnSale));

        List<Map<String, Object>> productsWithRebate = MySQLDataStoreUtilities.getRecords("Products", "ManufacturerRebate = true");
        inventoryData.put("productsWithRebate", filterProductsForInventory(productsWithRebate));

        out.print(gson.toJson(inventoryData));
    }

    private List<Map<String, Object>> filterProductsForInventory(List<Map<String, Object>> products) {
        List<Map<String, Object>> filteredProducts = new ArrayList<>();
        for (Map<String, Object> product : products) {
            Map<String, Object> filteredProduct = new HashMap<>();
            filteredProduct.put("ProductModelName", product.get("ProductModelName"));
            filteredProduct.put("ProductPrice", product.get("ProductPrice"));
            filteredProduct.put("Inventory", product.get("Inventory"));
            filteredProducts.add(filteredProduct);
        }
        return filteredProducts;
    }

    private void handleSalesReportRequest(HttpServletResponse response) throws SQLException, IOException {
        PrintWriter out = response.getWriter();
        Map<String, Object> salesData = new HashMap<>();

        List<Map<String, Object>> productSales = getProductSales();
        salesData.put("productSales", productSales);

        List<Map<String, Object>> dailySales = getDailySales();
        salesData.put("dailySales", dailySales);

        out.print(gson.toJson(salesData));
    }

    private List<Map<String, Object>> getProductSales() throws SQLException {
        String sql = "SELECT p.ProductModelName, p.ProductPrice, SUM(t.Quantity) as ItemsSold, " +
                     "SUM(t.TotalSales) as TotalSales " +
                     "FROM Products p " +
                     "JOIN Transactions t ON p.ProductID = t.ProductID " +
                     "GROUP BY p.ProductID " +
                     "ORDER BY TotalSales DESC";

        return executeQuery(sql, rs -> {
            Map<String, Object> sale = new HashMap<>();
            sale.put("productName", rs.getString("ProductModelName"));
            sale.put("productPrice", rs.getDouble("ProductPrice"));
            sale.put("itemsSold", rs.getInt("ItemsSold"));
            sale.put("totalSales", rs.getDouble("TotalSales"));
            return sale;
        });
    }

    private List<Map<String, Object>> getDailySales() throws SQLException {
        String sql = "SELECT DATE(PurchaseDate) as SaleDate, SUM(TotalSales) as TotalSales " +
                     "FROM Transactions " +
                     "GROUP BY DATE(PurchaseDate) " +
                     "ORDER BY SaleDate DESC";

        return executeQuery(sql, rs -> {
            Map<String, Object> sale = new HashMap<>();
            sale.put("date", rs.getString("SaleDate"));
            sale.put("totalSales", rs.getDouble("TotalSales"));
            return sale;
        });
    }

    private List<Map<String, Object>> executeQuery(String sql, SQLResultMapper mapper) throws SQLException {
        List<Map<String, Object>> results = new ArrayList<>();
        try (Connection conn = MySQLDataStoreUtilities.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            while (rs.next()) {
                results.add(mapper.map(rs));
            }
        }
        return results;
    }

    @FunctionalInterface
    private interface SQLResultMapper {
        Map<String, Object> map(ResultSet rs) throws SQLException;
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        BufferedReader reader = request.getReader();
        Map<String, Object> newProduct = gson.fromJson(reader, new TypeToken<Map<String, Object>>(){}.getType());

        PrintWriter out = response.getWriter();
        try {
            int productId = MySQLDataStoreUtilities.insertRecord("Products", filterProductForDatabase(newProduct));
            newProduct.put("ProductID", productId);
            
            appendProductToXML(newProduct);

            out.print(gson.toJson(newProduct));
            response.setStatus(HttpServletResponse.SC_CREATED);
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\": \"Error: " + e.getMessage() + "\"}");
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
                    // Update XML first
                    updateProductInXML(productId, updatedProduct);

                    // Then update database
                    Map<String, Object> filteredProduct = filterProductForDatabase(updatedProduct);
                    int rowsAffected = MySQLDataStoreUtilities.updateRecord("Products", filteredProduct, "ProductID = " + productId);
                    if (rowsAffected > 0) {
                        List<Map<String, Object>> products = MySQLDataStoreUtilities.getRecords("Products", "ProductID = " + productId);
                        out.print(gson.toJson(products.get(0)));
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\": \"Product not found\"}");
                    }
                } catch (Exception e) {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"error\": \"Error: " + e.getMessage() + "\"}");
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
                boolean xmlDeleted = false;
                try {
                    // Delete from XML first
                    deleteProductFromXML(productId);
                    xmlDeleted = true;

                    // Then delete from database
                    int rowsAffected = MySQLDataStoreUtilities.deleteRecord("Products", "ProductID = " + productId);
                    if (rowsAffected > 0) {
                        out.print("{\"message\": \"Product deleted successfully\"}");
                    } else {
                        // If product was not in database, revert XML deletion
                        if (xmlDeleted) {
                            revertXMLDeletion(productId);
                        }
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"error\": \"Product not found in database\"}");
                    }
                } catch (Exception e) {
                    // If there was an error deleting from database, revert XML deletion
                    if (xmlDeleted) {
                        try {
                            revertXMLDeletion(productId);
                        } catch (Exception revertException) {
                            // Log the revert exception
                            e.addSuppressed(revertException);
                        }
                    }
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"error\": \"Error: " + e.getMessage() + "\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Invalid request\"}");
            }
        }
        out.flush();
    }

    private Map<String, Object> filterProductForDatabase(Map<String, Object> product) {
        Map<String, Object> filteredProduct = new HashMap<>(product);
        filteredProduct.remove("RatingAvg");
        filteredProduct.remove("TotalRatings");
        filteredProduct.remove("Accessories");
        return filteredProduct;
    }

    private void appendProductToXML(Map<String, Object> product) throws Exception {
        DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
        DocumentBuilder docBuilder = docFactory.newDocumentBuilder();
        org.w3c.dom.Document doc;

        File xmlFile = new File(xmlFilePath);
        if (xmlFile.exists()) {
            doc = docBuilder.parse(xmlFile);
        } else {
            doc = docBuilder.newDocument();
            org.w3c.dom.Element rootElement = doc.createElement("ProductCatalog");
            doc.appendChild(rootElement);
        }

        org.w3c.dom.Element productElement = doc.createElement("Product");

        appendElement(doc, productElement, "ProductID", String.valueOf((int) Double.parseDouble(product.get("ProductID").toString())));
        appendElement(doc, productElement, "ProductModelName", (String) product.get("ProductModelName"));
        appendElement(doc, productElement, "ProductCategory", (String) product.get("ProductCategory"));
appendElement(doc, productElement, "ProductPrice", product.get("ProductPrice").toString());
        appendElement(doc, productElement, "ProductOnSale", product.get("ProductOnSale").toString());
        appendElement(doc, productElement, "ManufacturerName", (String) product.get("ManufacturerName"));
        appendElement(doc, productElement, "ManufacturerRebate", product.get("ManufacturerRebate").toString());
        appendElement(doc, productElement, "Inventory", product.get("Inventory").toString());
        appendElement(doc, productElement, "ProductImage", (String) product.get("ProductImage"));
        appendElement(doc, productElement, "ProductDescription", (String) product.get("ProductDescription"));

        doc.getDocumentElement().appendChild(productElement);

        writeXmlFile(doc);
    }

    private void updateProductInXML(int productId, Map<String, Object> updatedProduct) throws Exception {
        DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
        DocumentBuilder docBuilder = docFactory.newDocumentBuilder();
        org.w3c.dom.Document doc = docBuilder.parse(new File(xmlFilePath));

        NodeList products = doc.getElementsByTagName("Product");
        boolean productFound = false;

        for (int i = 0; i < products.getLength(); i++) {
            Element product = (Element) products.item(i);
            NodeList productIdNodes = product.getElementsByTagName("ProductID");
            
            if (productIdNodes.getLength() > 0) {
                String xmlProductId = productIdNodes.item(0).getTextContent();
                // Compare the integer part of the ProductID
                if (xmlProductId.split("\\.")[0].equals(String.valueOf(productId))) {
                    updateProductElement(product, updatedProduct);
                    productFound = true;
                    break;
                }
            } else {
                // If ProductID is not present, try to match based on other attributes
                String productName = getElementTextContent(product, "ProductModelName");
                String productCategory = getElementTextContent(product, "ProductCategory");
                String productPrice = getElementTextContent(product, "ProductPrice");
                
                if (productName.equals(updatedProduct.get("ProductModelName")) &&
                    productCategory.equals(updatedProduct.get("ProductCategory")) &&
                    productPrice.equals(updatedProduct.get("ProductPrice").toString())) {
                    
                    updateProductElement(product, updatedProduct);
                    productFound = true;
                    break;
                }
            }
        }

        if (!productFound) {
            // If the product wasn't found, add it as a new product
            Element newProduct = doc.createElement("Product");
            appendElement(doc, newProduct, "ProductID", String.valueOf(productId));
            updateProductElement(newProduct, updatedProduct);
            doc.getDocumentElement().appendChild(newProduct);
        }

        writeXmlFile(doc);
    }

    private void deleteProductFromXML(int productId) throws Exception {
        DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
        DocumentBuilder docBuilder = docFactory.newDocumentBuilder();
        org.w3c.dom.Document doc = docBuilder.parse(new File(xmlFilePath));

        NodeList products = doc.getElementsByTagName("Product");
        boolean productFound = false;

        for (int i = 0; i < products.getLength(); i++) {
            Element product = (Element) products.item(i);
            NodeList productIdNodes = product.getElementsByTagName("ProductID");
            
            if (productIdNodes.getLength() > 0) {
                String xmlProductId = productIdNodes.item(0).getTextContent();
                // Compare the integer part of the ProductID
                if (xmlProductId.split("\\.")[0].equals(String.valueOf(productId))) {
                    product.getParentNode().removeChild(product);
                    productFound = true;
                    break;
                }
            } else {
                // If ProductID is not present, try to match based on other attributes
                String productName = getElementTextContent(product, "ProductModelName");
                String productCategory = getElementTextContent(product, "ProductCategory");
                String productPrice = getElementTextContent(product, "ProductPrice");
                
                // Fetch the product details from the database
                List<Map<String, Object>> dbProducts = MySQLDataStoreUtilities.getRecords("Products", "ProductID = " + productId);
                if (!dbProducts.isEmpty()) {
                    Map<String, Object> dbProduct = dbProducts.get(0);
                    
                    // Compare the XML product with the database product
                    if (productName.equals(dbProduct.get("ProductModelName")) &&
                        productCategory.equals(dbProduct.get("ProductCategory")) &&
                        productPrice.equals(dbProduct.get("ProductPrice").toString())) {
                        
                        product.getParentNode().removeChild(product);
                        productFound = true;
                        break;
                    }
                }
            }
        }

        if (!productFound) {
            throw new Exception("Product with ID " + productId + " not found in XML file");
        }

        writeXmlFile(doc);
    }

    private void revertXMLDeletion(int productId) throws Exception {
        // Retrieve the product data from the database
        List<Map<String, Object>> products = MySQLDataStoreUtilities.getRecords("Products", "ProductID = " + productId);
        if (!products.isEmpty()) {
            Map<String, Object> product = products.get(0);
            // Re-add the product to the XML file
            appendProductToXML(product);
        } else {
            throw new Exception("Unable to revert XML deletion: Product not found in database");
        }
    }

    private void updateProductElement(Element product, Map<String, Object> updatedProduct) {
        updateElement(product, "ProductID", String.valueOf((int) Double.parseDouble(updatedProduct.get("ProductID").toString())));
        updateElement(product, "ProductModelName", (String) updatedProduct.get("ProductModelName"));
        updateElement(product, "ProductCategory", (String) updatedProduct.get("ProductCategory"));
        updateElement(product, "ProductPrice", updatedProduct.get("ProductPrice").toString());
        updateElement(product, "ProductOnSale", updatedProduct.get("ProductOnSale").toString());
        updateElement(product, "ManufacturerName", (String) updatedProduct.get("ManufacturerName"));
        updateElement(product, "ManufacturerRebate", updatedProduct.get("ManufacturerRebate").toString());
        updateElement(product, "Inventory", updatedProduct.get("Inventory").toString());
        updateElement(product, "ProductImage", (String) updatedProduct.get("ProductImage"));
        updateElement(product, "ProductDescription", (String) updatedProduct.get("ProductDescription"));
    }

    private void appendElement(org.w3c.dom.Document doc, Element parent, String elementName, String textContent) {
        Element element = doc.createElement(elementName);
        element.setTextContent(textContent);
        parent.appendChild(element);
    }

    private void updateElement(Element parent, String elementName, String textContent) {
        NodeList elements = parent.getElementsByTagName(elementName);
        if (elements.getLength() > 0) {
            elements.item(0).setTextContent(textContent);
        } else {
            Element newElement = parent.getOwnerDocument().createElement(elementName);
            newElement.setTextContent(textContent);
            parent.appendChild(newElement);
        }
    }

    private String getElementTextContent(Element parent, String elementName) {
        NodeList elements = parent.getElementsByTagName(elementName);
        if (elements.getLength() > 0) {
            return elements.item(0).getTextContent();
        }
        return "";
    }

    private void writeXmlFile(org.w3c.dom.Document doc) throws TransformerException {
        TransformerFactory transformerFactory = TransformerFactory.newInstance();
        Transformer transformer = transformerFactory.newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        DOMSource source = new DOMSource(doc);
        StreamResult result = new StreamResult(new File(xmlFilePath));
        transformer.transform(source, result);
    }
}