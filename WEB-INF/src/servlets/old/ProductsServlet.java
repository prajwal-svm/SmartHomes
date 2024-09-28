import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;
import java.util.*;
import java.net.URLDecoder;

@WebServlet("/products/*")
public class ProductsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private List<Product> products;
    private String productsFilePath;

    public void init() throws ServletException {
        productsFilePath = getServletContext().getRealPath("/WEB-INF/products.txt");
        products = parseProductsFromFile();
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();
        PrintWriter out = response.getWriter();

        if (pathInfo == null || pathInfo.equals("/")) {
            String typeParam = request.getParameter("type");
            List<Product> filteredProducts;

            if (typeParam != null && !typeParam.isEmpty()) {
                String decodedType = URLDecoder.decode(typeParam, "UTF-8");
                filteredProducts = filterProductsByType(decodedType);
            } else {
                filteredProducts = products;
            }

            out.print(toJson(filteredProducts));
        } else {
            String[] splits = pathInfo.split("/");
            if (splits.length == 2) {
                String productId = splits[1];
                Product product = findProductById(productId);
                if (product != null) {
                    out.print(product.toJson());
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"error\": \"Product not found\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Invalid request\"}");
            }
        }
        out.flush();
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        BufferedReader reader = request.getReader();
        StringBuilder jsonBuilder = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            jsonBuilder.append(line);
        }
        String json = jsonBuilder.toString();

        Product newProduct = Product.fromJson(json);
        products.add(newProduct);
        saveProductsToFile();

        PrintWriter out = response.getWriter();
        out.print(newProduct.toJson());
        out.flush();

        response.setStatus(HttpServletResponse.SC_CREATED);
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
                String productId = splits[1];
                Product existingProduct = findProductById(productId);
                if (existingProduct != null) {
                    BufferedReader reader = request.getReader();
                    StringBuilder jsonBuilder = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        jsonBuilder.append(line);
                    }
                    String json = jsonBuilder.toString();

                    Product updatedProduct = Product.fromJson(json);
                    updateProduct(existingProduct, updatedProduct);
                    saveProductsToFile();

                    out.print(existingProduct.toJson());
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"error\": \"Product not found\"}");
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
                String productId = splits[1];
                Product productToRemove = findProductById(productId);
                if (productToRemove != null) {
                    products.remove(productToRemove);
                    saveProductsToFile();
                    out.print("{\"message\": \"Product deleted successfully\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"error\": \"Product not found\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\": \"Invalid request\"}");
            }
        }
        out.flush();
    }

    private List<Product> filterProductsByType(String type) {
        List<Product> filteredList = new ArrayList<>();
        for (Product product : products) {
            if (product.category != null && product.category.equalsIgnoreCase(type)) {
                filteredList.add(product);
            }
        }
        return filteredList;
    }

    private Product findProductById(String id) {
        for (Product product : products) {
            if (product.id.equals(id)) {
                return product;
            }
        }
        return null;
    }

    private void updateProduct(Product existingProduct, Product updatedProduct) {
        existingProduct.category = updatedProduct.category;
        existingProduct.name = updatedProduct.name;
        existingProduct.price = updatedProduct.price;
        existingProduct.description = updatedProduct.description;
        existingProduct.images = updatedProduct.images;
        existingProduct.brand = updatedProduct.brand;
        existingProduct.features = updatedProduct.features;
        existingProduct.accessories = updatedProduct.accessories;
    }

    private List<Product> parseProductsFromFile() {
        List<Product> productList = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(productsFilePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\\|");
                if (parts.length >= 8) {
                    Product product = new Product(
                        parts[0], // category
                        parts[1], // id
                        parts[2], // name
                        Double.parseDouble(parts[3].substring(1)), // price
                        parts[4], // description
                        Arrays.asList(parts[5].split(",")), // images
                        parts[6], // brand
                        Arrays.asList(parts[7].split(",")), // features
                        parts.length > 8 ? Arrays.asList(parts[8].split(",")) : new ArrayList<>() // accessories
                    );
                    productList.add(product);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return productList;
    }

    private void saveProductsToFile() {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(productsFilePath))) {
            for (Product product : products) {
                bw.write(String.format("%s|%s|%s|$%.2f|%s|%s|%s|%s|%s\n",
                    product.category,
                    product.id,
                    product.name,
                    product.price,
                    product.description,
                    String.join(",", product.images),
                    product.brand,
                    String.join(",", product.features),
                    String.join(",", product.accessories)
                ));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private String toJson(List<Product> products) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < products.size(); i++) {
            if (i > 0) {
                json.append(",");
            }
            json.append(products.get(i).toJson());
        }
        json.append("]");
        return json.toString();
    }

    private static class Product {
        String category;
        String id;
        String name;
        double price;
        String description;
        List<String> images;
        String brand;
        List<String> features;
        List<String> accessories;

        Product(String category, String id, String name, double price, String description,
                List<String> images, String brand, List<String> features, List<String> accessories) {
            this.category = category;
            this.id = id;
            this.name = name;
            this.price = price;
            this.description = description;
            this.images = images;
            this.brand = brand;
            this.features = features;
            this.accessories = accessories;
        }

        String toJson() {
            return String.format(
                "{\"category\":\"%s\",\"id\":\"%s\",\"name\":\"%s\",\"price\":%.2f,\"description\":\"%s\",\"images\":%s,\"brand\":\"%s\",\"features\":%s,\"accessories\":%s}",
                escapeJson(category),
                escapeJson(id),
                escapeJson(name),
                price,
                escapeJson(description),
                listToJson(images),
                escapeJson(brand),
                listToJson(features),
                listToJson(accessories)
            );
        }

        static Product fromJson(String json) throws IOException {
            Map<String, String> map = new HashMap<>();
            json = json.substring(1, json.length() - 1); // Remove { }
            String[] pairs = json.split(",");
            for (String pair : pairs) {
                String[] keyValue = pair.split(":");
                if (keyValue.length == 2) {  // Ensure there are two parts (key and value)
                    String key = keyValue[0].trim().replace("\"", "");
                    String value = keyValue[1].trim().replace("\"", "");
                    map.put(key, value);
                }
            }

            return new Product(
                map.get("category"),
                map.get("id"),
                map.get("name"),
                Double.parseDouble(map.get("price")),
                map.get("description"),
                parseList(map.get("images")),  // Handle list fields properly
                map.get("brand"),
                parseList(map.get("features")),
                parseList(map.get("accessories"))
            );
        }

        private static List<String> parseList(String input) {
            if (input == null || input.trim().isEmpty()) {
                return new ArrayList<>();
            }
            String[] items = input.split(",");
            return Arrays.asList(items);
        }

        private String listToJson(List<String> list) {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) {
                    sb.append(",");
                }
                sb.append("\"").append(escapeJson(list.get(i))).append("\"");
            }
            sb.append("]");
            return sb.toString();
        }

        private String escapeJson(String input) {
            if (input == null) {
                return "";
            }
            return input.replace("\"", "\\\"")
                        .replace("\n", "\\n")
                        .replace("\r", "\\r")
                        .replace("\t", "\\t");
        }
    }
}
