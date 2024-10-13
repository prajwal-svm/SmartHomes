package utilities;

import java.sql.*;
import java.util.*;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.w3c.dom.Element;

public class MySQLDataStoreUtilities {
    private static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";
    private static final String DB_URL = "jdbc:mysql://localhost:3306/smarthomes";
    private static final String USER = "root";
    private static final String PASS = "PasswOrd1!";

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName(JDBC_DRIVER);
            return DriverManager.getConnection(DB_URL, USER, PASS);
        } catch (ClassNotFoundException e) {
            throw new SQLException("JDBC Driver not found", e);
        }
    }

    public static void close(Connection conn, Statement stmt, ResultSet rs) {
        try {
            if (rs != null) rs.close();
            if (stmt != null) stmt.close();
            if (conn != null) conn.close();
        } catch (SQLException se) {
            se.printStackTrace();
        }
    }

    public static int insertRecord(String tableName, Map<String, Object> columnValues) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        int generatedId = -1;

        try {
            conn = getConnection();
            StringBuilder sql = new StringBuilder("INSERT INTO " + tableName + " (");
            StringBuilder placeholders = new StringBuilder();
            List<Object> values = new ArrayList<>();

            for (Map.Entry<String, Object> entry : columnValues.entrySet()) {
                sql.append(entry.getKey()).append(",");
                placeholders.append("?,");
                values.add(entry.getValue());
            }

            sql.setLength(sql.length() - 1);  // Remove last comma
            placeholders.setLength(placeholders.length() - 1);  // Remove last comma
            sql.append(") VALUES (").append(placeholders).append(")");

            pstmt = conn.prepareStatement(sql.toString(), Statement.RETURN_GENERATED_KEYS);

            for (int i = 0; i < values.size(); i++) {
                pstmt.setObject(i + 1, values.get(i));
            }

            pstmt.executeUpdate();

            rs = pstmt.getGeneratedKeys();
            if (rs.next()) {
                generatedId = rs.getInt(1);
            }
        } finally {
            close(conn, pstmt, rs);
        }

        return generatedId;
    }

    public static int updateRecord(String tableName, Map<String, Object> columnValues, String whereClause) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        int rowsAffected = 0;

        try {
            conn = getConnection();
            StringBuilder sql = new StringBuilder("UPDATE " + tableName + " SET ");
            List<Object> values = new ArrayList<>();

            for (Map.Entry<String, Object> entry : columnValues.entrySet()) {
                sql.append(entry.getKey()).append(" = ?,");
                values.add(entry.getValue());
            }

            sql.setLength(sql.length() - 1);  // Remove last comma
            sql.append(" WHERE ").append(whereClause);

            pstmt = conn.prepareStatement(sql.toString());

            for (int i = 0; i < values.size(); i++) {
                pstmt.setObject(i + 1, values.get(i));
            }

            rowsAffected = pstmt.executeUpdate();
        } finally {
            close(conn, pstmt, null);
        }

        return rowsAffected;
    }

    public static int deleteRecord(String tableName, String whereClause) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        int rowsAffected = 0;

        try {
            conn = getConnection();
            String sql = "DELETE FROM " + tableName + " WHERE " + whereClause;
            pstmt = conn.prepareStatement(sql);
            rowsAffected = pstmt.executeUpdate();
        } finally {
            close(conn, pstmt, null);
        }

        return rowsAffected;
    }

    public static List<Map<String, Object>> getRecords(String tableName, String whereClause) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        List<Map<String, Object>> records = new ArrayList<>();

        try {
            conn = getConnection();
            String sql = "SELECT * FROM " + tableName;
            if (whereClause != null && !whereClause.isEmpty()) {
                sql += " WHERE " + whereClause;
            }
            pstmt = conn.prepareStatement(sql);
            rs = pstmt.executeQuery();

            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();

            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    String columnName = metaData.getColumnName(i);
                    Object value = rs.getObject(i);
                    row.put(columnName, value);
                }
                records.add(row);
            }
        } finally {
            close(conn, pstmt, rs);
        }

        return records;
    }

    public static void loadProductsFromXML(String xmlFilePath) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(xmlFilePath);
        doc.getDocumentElement().normalize();

        NodeList productList = doc.getElementsByTagName("Product");

        for (int i = 0; i < productList.getLength(); i++) {
            Element product = (Element) productList.item(i);
            String modelName = product.getElementsByTagName("ProductModelName").item(0).getTextContent();
            String category = product.getElementsByTagName("ProductCategory").item(0).getTextContent();
            double price = Double.parseDouble(product.getElementsByTagName("ProductPrice").item(0).getTextContent());
            boolean onSale = Boolean.parseBoolean(product.getElementsByTagName("ProductOnSale").item(0).getTextContent());
            String manufacturerName = product.getElementsByTagName("ManufacturerName").item(0).getTextContent();
            boolean manufacturerRebate = Boolean.parseBoolean(product.getElementsByTagName("ManufacturerRebate").item(0).getTextContent());
            int inventory = Integer.parseInt(product.getElementsByTagName("Inventory").item(0).getTextContent());
            String image = product.getElementsByTagName("ProductImage").item(0).getTextContent();
            String description = product.getElementsByTagName("ProductDescription").item(0).getTextContent();

            Map<String, Object> columnValues = new HashMap<>();
            columnValues.put("ProductModelName", modelName);
            columnValues.put("ProductCategory", category);
            columnValues.put("ProductPrice", price);
            columnValues.put("ProductOnSale", onSale);
            columnValues.put("ManufacturerName", manufacturerName);
            columnValues.put("ManufacturerRebate", manufacturerRebate);
            columnValues.put("Inventory", inventory);
            columnValues.put("ProductImage", image);
            columnValues.put("ProductDescription", description);

            insertRecord("Products", columnValues); // Insert each product into the database
        }
    }
}
