import { useState } from 'react';
import { MoreHorizontal, Eye, Edit, Trash2, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast"
import { Link } from 'react-router-dom';

export default function Catalog({ products, refetchProducts }) {
    const { toast } = useToast();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editedProduct, setEditedProduct] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleView = (product) => {
        setSelectedProduct(product);
        setCurrentImageIndex(0);
        setIsViewDialogOpen(true);
    };

    const handleEdit = (product) => {
        setEditedProduct({ ...product });
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (productId) => {
        const result = await fetch('http://localhost:8080/SmartHomes/products/' + productId, {
            method: 'DELETE',
        });

        const data = await result.json();

        toast({
            title: "Product Deleted",
            description: "The product has been successfully deleted.",
            variant: "success",
        });

        await refetchProducts();
    };

    const handleSaveEdit = async () => {
        // Implement save logic here
        console.log('Saving edited product:', editedProduct);
        const result = await fetch('http://localhost:8080/SmartHomes/products/' + editedProduct.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...editedProduct,
                features: editedProduct.features.join(','),
                accessories: editedProduct.accessories.join(','),
                images: editedProduct.images.join(','),
            }),
        });

        const data = await result.json();

        setIsEditDialogOpen(false);

        await refetchProducts();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayInputChange = (e, field) => {
        const { value } = e.target;
        setEditedProduct(prev => ({
            ...prev,
            [field]: value.split(',').map(item => item.trim())
        }));
    };

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) =>
            (prevIndex + 1) % selectedProduct.images.length
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            (prevIndex - 1 + selectedProduct.images.length) % selectedProduct.images.length
        );
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newProduct = Object.fromEntries(formData.entries());
        newProduct.price = parseFloat(newProduct.price);
        newProduct.features = newProduct.features.split(',').map(item => item.trim());
        newProduct.accessories = newProduct.accessories.split(',').map(item => item.trim());
        newProduct.images = newProduct.images.split(',').map(item => item.trim());
        newProduct.id = Date.now();

        console.log('Adding new product:', newProduct);
        const result = await fetch('http://localhost:8080/SmartHomes/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProduct),
        });

        const data = await result.json();
        console.log(data);
        refetchProducts();
    }

    return (
        <Card className='w-full border-0'>
            <CardHeader className='text-left relative'>
                <Link to="/" className="flex items-center gap-2 text-blue-600 hover:underline mb-2">
                    <ChevronLeft className='w-4 h-4' />  Home
                </Link>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                    Manage your products and view their details.
                </CardDescription>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="mt-4 w-fit absolute top-12 right-10 bg-black">Add New Product</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddProduct}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" >
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="price" >
                                        Price
                                    </Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="category" >
                                        Category
                                    </Label>
                                    <Input
                                        id="category"
                                        name="category"
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="brand" >
                                        Brand
                                    </Label>
                                    <Input
                                        id="brand"
                                        name="brand"
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" >
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="features" >
                                        Features
                                    </Label>
                                    <Textarea
                                        id="features"
                                        name="features"
                                        className="col-span-3"
                                        placeholder="Enter features separated by commas"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="accessories" >
                                        Accessories
                                    </Label>
                                    <Textarea
                                        id="accessories"
                                        name="accessories"
                                        placeholder="Enter accessories separated by commas"
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="images" >
                                        Images
                                    </Label>
                                    <Textarea
                                        id="images"
                                        name="images"
                                        placeholder="Enter image URLs separated by commas"
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type='submit'>Add Product</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table className="w-full text-left text-black">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.ProductID}>
                                <TableCell className="font-medium">
                                    <img
                                        src={`/${product.ProductImage}`}
                                        alt={product.ProductModelName}
                                        className="w-12 h-12 object-cover rounded-lg"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{product.ProductModelName}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {product.ProductCategory}
                                    </Badge>
                                </TableCell>
                                <TableCell>${product.ProductPrice.toFixed(2)}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Actions</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleView(product)}>
                                                <Eye className="mr-2 h-4 w-4" /> View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(product.ProductID)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{products.length}</strong> products
                </div>
            </CardFooter>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{selectedProduct?.ProductModelName}</DialogTitle>
                        <DialogDescription>
                            <div className="relative">
                                <img
                                    src={selectedProduct?.ProductImage || "/placeholder.svg"}
                                    alt={`${selectedProduct?.ProductModelName} - Image ${currentImageIndex + 1}`}
                                    className="w-full h-[200px] object-cover mb-4"
                                />
                                <Button size="icon" variant="outline" className="absolute left-2 top-1/2 transform -translate-y-1/2" onClick={prevImage}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="outline" className="absolute right-2 top-1/2 transform -translate-y-1/2" onClick={nextImage}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{selectedProduct?.ProductDescription}</p>
                            <p className="text-lg font-bold mb-2">${selectedProduct?.ProductPrice.toFixed(2)}</p>
                            <p className="text-sm mb-2"><strong>Brand:</strong> {selectedProduct?.ProductBrand}</p>
                            <p className="text-sm mb-2"><strong>Category:</strong> {selectedProduct?.ProductCategory}</p>
                            <div className="mb-2">
                                <strong>Features:</strong>
                                <ul className="list-disc list-inside">
                                    {selectedProduct?.features?.map((feature, index) => (
                                        <li key={index} className="text-sm">{feature}</li>
                                    ))}
                                </ul>
                            </div>
                            {selectedProduct?.Accessories.length > 0 && (
                                <div className="mb-2">
                                    <strong>Accessories:</strong>
                                    <ul className="list-disc list-inside">
                                        {selectedProduct?.Accessories.map((accessory, index) => (
                                            <li key={index} className="text-sm">{accessory.AccessoryID}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <Button className="w-full flex items-center justify-center mt-4">
                                <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                            </Button>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" >
                                Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={editedProduct?.ProductModelName || ''}
                                onChange={handleInputChange}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" >
                                Price
                            </Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                value={editedProduct?.ProductPrice || ''}
                                onChange={handleInputChange}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" >
                                Category
                            </Label>
                            <Input
                                id="category"
                                name="category"
                                value={editedProduct?.ProductCategory || ''}
                                onChange={handleInputChange}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="brand" >
                                Brand
                            </Label>
                            <Input
                                id="brand"
                                name="brand"
                                value={editedProduct?.ManufacturerName || ''}
                                onChange={handleInputChange}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" >
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={editedProduct?.ProductDescription || ''}
                                onChange={handleInputChange}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="features" >
                                Features
                            </Label>
                            <Textarea
                                id="features"
                                name="features"
                                value={editedProduct?.features?.join(', ') || ''}
                                onChange={(e) => handleArrayInputChange(e, 'features')}
                                className="col-span-3"
                                placeholder="Enter features separated by commas"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="accessories" >
                                Accessories
                            </Label>
                            <Textarea
                                id="accessories"
                                name="accessories"
                                value={editedProduct?.Accessories?.join(', ') || ''}
                                onChange={(e) => handleArrayInputChange(e, 'accessories')}
                                className="col-span-3"
                                placeholder="Enter accessories separated by commas"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="images" >
                                Images
                            </Label>
                            <Textarea
                                id="images"
                                name="images"
                                value={editedProduct?.ProductImage}
                                onChange={(e) => handleArrayInputChange(e, 'images')}
                                className="col-span-3"
                                placeholder="Enter image URLs separated by commas"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveEdit}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}