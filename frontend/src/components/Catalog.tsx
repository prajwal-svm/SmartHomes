import { useState } from 'react';
import { MoreHorizontal, Eye, Edit, Trash2, ChevronLeft } from "lucide-react";
import { Link } from 'react-router-dom';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast"

interface Product {
    ProductID: number;
    ProductModelName: string;
    ProductCategory: string;
    ProductPrice: number;
    ProductImage: string;
    ProductDescription: string;
    ProductOnSale: boolean;
    ManufacturerName: string;
    ManufacturerRebate: boolean;
    Inventory: number;
}

export default function Catalog({ products, refetchProducts }: { products: Product[], refetchProducts: () => void }) {
    const { toast } = useToast();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
    const [editedProduct, setEditedProduct] = useState<Product | null>(null);

    const handleView = (product: Product) => {
        setSelectedProduct(product);
        setIsViewDialogOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditedProduct({ ...product });
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (productId: number) => {
        const result = await fetch(`http://localhost:8080/SmartHomes/products/${productId}`, {
            method: 'DELETE',
        });

        const data = await result.json();

        toast({
            title: "Product Deleted",
            description: "The product has been successfully deleted.",
            variant: "default",
        });

        await refetchProducts();
    };

    const handleSaveEdit = async () => {
        if (!editedProduct) return; // Ensure editedProduct is not null
        const result = await fetch(`http://localhost:8080/SmartHomes/products/${editedProduct.ProductID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(editedProduct),
        });

        const data = await result.json();

        setIsEditDialogOpen(false);

        await refetchProducts();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target;
        setEditedProduct(prev => prev ? {
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        } : null);
    };

    const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newProduct: Product = {
            ProductID: 0, // Assuming ID is generated on the server
            ProductModelName: formData.get("ProductModelName") as string,
            ProductCategory: formData.get("ProductCategory") as string,
            ProductPrice: parseFloat(formData.get("ProductPrice") as string),
            ProductImage: formData.get("ProductImage") as string,
            ProductDescription: formData.get("ProductDescription") as string,
            ProductOnSale: formData.get("ProductOnSale") === 'on',
            ManufacturerName: formData.get("ManufacturerName") as string,
            ManufacturerRebate: formData.get("ManufacturerRebate") === 'on',
            Inventory: parseInt(formData.get("Inventory") as string),
        };

        const result = await fetch('http://localhost:8080/SmartHomes/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProduct),
        });

        const data = await result.json();
        console.log("data", data);
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
                                    <Label htmlFor="ProductModelName">Name</Label>
                                    <Input id="ProductModelName" name="ProductModelName" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ProductCategory">Category</Label>
                                    <Input id="ProductCategory" name="ProductCategory" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ProductPrice">Price</Label>
                                    <Input id="ProductPrice" name="ProductPrice" type="number" step="0.01" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ProductOnSale">On Sale</Label>
                                    <Checkbox id="ProductOnSale" name="ProductOnSale" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ManufacturerName">Manufacturer</Label>
                                    <Input id="ManufacturerName" name="ManufacturerName" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ManufacturerRebate">Rebate</Label>
                                    <Checkbox id="ManufacturerRebate" name="ManufacturerRebate" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="Inventory">Inventory</Label>
                                    <Input id="Inventory" name="Inventory" type="number" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ProductImage">Image URL</Label>
                                    <Input id="ProductImage" name="ProductImage" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ProductDescription">Description</Label>
                                    <Textarea id="ProductDescription" name="ProductDescription" className="col-span-3" required />
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Inventory</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.ProductID}>
                                <TableCell>
                                    <img src={product.ProductImage} alt={product.ProductModelName} className="w-12 h-12 object-cover rounded-lg" />
                                </TableCell>
                                <TableCell>{product.ProductModelName}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{product.ProductCategory}</Badge>
                                </TableCell>
                                <TableCell>${product.ProductPrice.toFixed(2)}</TableCell>
                                <TableCell>{product.Inventory}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedProduct?.ProductModelName}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <img src={selectedProduct?.ProductImage} alt={selectedProduct?.ProductModelName} className="w-full h-48 object-cover rounded-lg" />
                        <p>{selectedProduct?.ProductDescription}</p>
                        <div className="flex justify-between">
                            <span>Price: ${selectedProduct?.ProductPrice.toFixed(2)}</span>
                            <span>Category: {selectedProduct?.ProductCategory}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Manufacturer: {selectedProduct?.ManufacturerName}</span>
                            <span>Inventory: {selectedProduct?.Inventory}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>On Sale: {selectedProduct?.ProductOnSale ? 'Yes' : 'No'}</span>
                            <span>Manufacturer Rebate: {selectedProduct?.ManufacturerRebate ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-ProductModelName">Model Name</Label>
                            <Input id="edit-ProductModelName" name="ProductModelName" value={editedProduct?.ProductModelName || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-ProductCategory">Category</Label>
                            <Input id="edit-ProductCategory" name="ProductCategory" value={editedProduct?.ProductCategory || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-ProductPrice">Price</Label>
                            <Input id="edit-ProductPrice" name="ProductPrice" type="number" step="0.01" value={editedProduct?.ProductPrice || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-ProductOnSale">On Sale</Label>
                            <Checkbox id="edit-ProductOnSale" name="ProductOnSale" checked={editedProduct?.ProductOnSale || false} onCheckedChange={(checked) => handleInputChange({ target: { name: 'ProductOnSale', type: 'checkbox', checked } })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-ManufacturerName">Manufacturer</Label>
                            <Input id="edit-ManufacturerName" name="ManufacturerName" value={editedProduct?.ManufacturerName || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-ManufacturerRebate">Manufacturer Rebate</Label>
                            <Checkbox id="edit-ManufacturerRebate" name="ManufacturerRebate" checked={editedProduct?.ManufacturerRebate || false} onCheckedChange={(checked) => handleInputChange({ target: { name: 'ManufacturerRebate', type: 'checkbox', checked } })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-Inventory">Inventory</Label>
                            <Input id="edit-Inventory" name="Inventory" type="number" value={editedProduct?.Inventory || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-ProductImage">Image URL</Label>
                            <Input id="edit-ProductImage" name="ProductImage" value={editedProduct?.ProductImage || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-ProductDescription">Description</Label>
                            <Textarea id="edit-ProductDescription" name="ProductDescription" value={editedProduct?.ProductDescription || ''} onChange={handleInputChange} className="col-span-3" />
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