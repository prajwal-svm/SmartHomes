package utilities;

import java.io.*;
import java.sql.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import javax.xml.parsers.*;
import org.w3c.dom.*;
import com.google.gson.Gson;

@WebServlet("/search-products")
public class AjaxUtility extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static HashMap<String, Product> productsMap = new HashMap<>();
    private Gson gson = new Gson();

    @Override
    public void init() throws ServletException {
        super.init();
        loadProductsFromXML();
        storeProductsInDatabase();
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String query = request.getParameter("query");
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        try {
            List<Product> suggestions = getProductSuggestions(query);
            out.print(gson.toJson(suggestions));
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\": \"Database error: " + e.getMessage() + "\"}");
        }
        out.flush();
    }

    private List<Product> getProductSuggestions(String query) throws SQLException {
        List<Product> suggestions = new ArrayList<>();
        String sql = "SELECT * FROM Products WHERE ProductModelName LIKE ? LIMIT 10";

        try (Connection conn = MySQLDataStoreUtilities.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, "%" + query + "%");
            ResultSet rs = pstmt.executeQuery();

            while (rs.next()) {
                Product product = new Product(
                    rs.getInt("ProductID"),
                    rs.getString("ProductModelName"),
                    rs.getString("ProductCategory"),
                    rs.getDouble("ProductPrice"),
                    rs.getBoolean("ProductOnSale"),
                    rs.getString("ManufacturerName"),
                    rs.getBoolean("ManufacturerRebate"),
                    rs.getInt("Inventory"),
                    rs.getString("ProductImage"),
                    rs.getString("ProductDescription")
                );
                suggestions.add(product);
            }
        }
        return suggestions;
    }

    private void loadProductsFromXML() {
        String xmlFilePath = getServletContext().getRealPath("/WEB-INF/ProductCatalog.xml");
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new File(xmlFilePath));
            doc.getDocumentElement().normalize();

            NodeList productNodes = doc.getElementsByTagName("Product");
            for (int i = 0; i < productNodes.getLength(); i++) {
                Element productElement = (Element) productNodes.item(i);
                Product product = new Product(
                    0, // ProductID will be assigned by the database
                    getElementTextContent(productElement, "ProductModelName"),
                    getElementTextContent(productElement, "ProductCategory"),
                    Double.parseDouble(getElementTextContent(productElement, "ProductPrice")),
                    Boolean.parseBoolean(getElementTextContent(productElement, "ProductOnSale")),
                    getElementTextContent(productElement, "ManufacturerName"),
                    Boolean.parseBoolean(getElementTextContent(productElement, "ManufacturerRebate")),
                    Integer.parseInt(getElementTextContent(productElement, "Inventory")),
                    getElementTextContent(productElement, "ProductImage"),
                    getElementTextContent(productElement, "ProductDescription")
                );
                productsMap.put(product.getProductModelName(), product);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String getElementTextContent(Element parentElement, String elementName) {
        NodeList nodeList = parentElement.getElementsByTagName(elementName);
        if (nodeList != null && nodeList.getLength() > 0) {
            return nodeList.item(0).getTextContent();
        }
        return "";
    }

    private void storeProductsInDatabase() {
        for (Product product : productsMap.values()) {
            try {
                // Check if the product already exists in the database
                String checkSql = "SELECT COUNT(*) FROM Products WHERE ProductModelName = ?";
                try (Connection conn = MySQLDataStoreUtilities.getConnection();
                     PreparedStatement checkPstmt = conn.prepareStatement(checkSql)) {
                    checkPstmt.setString(1, product.getProductModelName());
                    ResultSet checkRs = checkPstmt.executeQuery();
                    checkRs.next();
                    int count = checkRs.getInt(1);

                    // Only insert if the product does not already exist
                    if (count == 0) {
                        String sql = "INSERT INTO Products (ProductModelName, ProductCategory, ProductPrice, ProductOnSale, " +
                                     "ManufacturerName, ManufacturerRebate, Inventory, ProductImage, ProductDescription) " +
                                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                            pstmt.setString(1, product.getProductModelName());
                            pstmt.setString(2, product.getProductCategory());
                            pstmt.setDouble(3, product.getProductPrice());
                            pstmt.setBoolean(4, product.isProductOnSale());
                            pstmt.setString(5, product.getManufacturerName());
                            pstmt.setBoolean(6, product.isManufacturerRebate());
                            pstmt.setInt(7, product.getInventory());
                            pstmt.setString(8, product.getProductImage());
                            pstmt.setString(9, product.getProductDescription());
                            pstmt.executeUpdate();
                        }
                    }
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    private static class Product {
        private int productID;
        private String productModelName;
        private String productCategory;
        private double productPrice;
        private boolean productOnSale;
        private String manufacturerName;
        private boolean manufacturerRebate;
        private int inventory;
        private String productImage;
        private String productDescription;

        // Constructor
        public Product(int productID, String productModelName, String productCategory, double productPrice,
                       boolean productOnSale, String manufacturerName, boolean manufacturerRebate,
                       int inventory, String productImage, String productDescription) {
            this.productID = productID;
            this.productModelName = productModelName;
            this.productCategory = productCategory;
            this.productPrice = productPrice;
            this.productOnSale = productOnSale;
            this.manufacturerName = manufacturerName;
            this.manufacturerRebate = manufacturerRebate;
            this.inventory = inventory;
            this.productImage = productImage;
            this.productDescription = productDescription;
        }

        // Getters
        public int getProductID() { return productID; }
        public String getProductModelName() { return productModelName; }
        public String getProductCategory() { return productCategory; }
        public double getProductPrice() { return productPrice; }
        public boolean isProductOnSale() { return productOnSale; }
        public String getManufacturerName() { return manufacturerName; }
        public boolean isManufacturerRebate() { return manufacturerRebate; }
        public int getInventory() { return inventory; }
        public String getProductImage() { return productImage; }
        public String getProductDescription() { return productDescription; }
    }
}