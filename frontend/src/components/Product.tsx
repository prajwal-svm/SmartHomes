'use client'

import React, { useState, useMemo } from 'react'
import { ShoppingCart, Eye, Plus, Minus, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from 'framer-motion'

interface ProductProps {
    ProductID: string | number
    ProductModelName: string
    ProductDescription: string
    ProductPrice: number
    ProductImage: string
    imageUrls: string[]
    Accessories: Accessory[]
    quantity?: number
    products: any[]
    setCart: (ProductID: string, count: number, warranty: boolean, accessories: string[]) => void
    RatingAvg: number
    TotalRatings: number
}

interface Accessory {
    ProductID: string
    AccessoryID: string
}

const WARRANTY_PRICE = 49.99

const StarRating: React.FC<{ rating: number, totalRatings: number }> = ({ rating, totalRatings = 0 }) => {
    return (
        <div className="flex items-center my-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
            ))}
            <span className="ml-2 text-sm text-gray-600 text-muted-foreground">{totalRatings === 0 ? window?.location.pathname === '/trending' ? '' : 'No reviews' : `${totalRatings} reviews`}</span>
        </div>
    )
}

export default function Product({ 
    ProductID, 
    ProductModelName, 
    ProductDescription, 
    ProductPrice, 
    ProductImage,
    imageUrls, 
    Accessories = [], 
    quantity = 0, 
    setCart, 
    products,
    RatingAvg,
    TotalRatings
}: ProductProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isWarrantySelected, setIsWarrantySelected] = useState(false)
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>([])

    const images = useMemo(() => ([
        `/${ProductImage}`,
        '/spare1.jpg',
        '/spare2.jpg',
    ]), [ProductImage]);

    const truncateDescription = (text: string, maxLength: number) => {
        if (text?.length <= maxLength) return text
        return text?.substr(0, maxLength) + '...'
    }

    const handleAddToCart = () => {
        setCart(ProductID, 1, isWarrantySelected, selectedAccessories)
    }

    const handleRemoveFromCart = () => {
        setCart(ProductID, -1, isWarrantySelected, selectedAccessories)
    }

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
    }

    const toggleAccessory = (accessoryId: string) => {
        setSelectedAccessories(prev =>
            prev.includes(accessoryId)
                ? prev.filter(ProductID => ProductID !== accessoryId)
                : [...prev, accessoryId]
        )
    }

    const contents = useMemo(() => Accessories?.map((accessory) => ({
        ProductID: accessory.AccessoryID,
        ...products?.find((product) => product.ProductID === accessory.AccessoryID)
    })), [Accessories, products]);

    const totalPrice = useMemo(() => {
        const accessoriesPrice = selectedAccessories.reduce((total, accessoryId) => {
            const accessory = contents.find(a => a.ProductID === accessoryId)
            return total + (accessory?.ProductPrice || 0)
        }, 0)
        return ProductPrice + (isWarrantySelected ? WARRANTY_PRICE : 0) + accessoriesPrice
    }, [ProductPrice, isWarrantySelected, selectedAccessories, contents])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="w-[320px] overflow-hidden">
                <motion.img 
                    src={ProductImage ? `/${ProductImage}` :`image${Math.floor(Math.random() * (14) + 1)}.jpg`} 
                    alt={ProductModelName} 
                    className="w-full h-[200px] object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                />
                <CardContent className="p-4 text-left h-100">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-1">{ProductModelName}</h3>
                    <StarRating rating={RatingAvg} totalRatings={TotalRatings} />
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{truncateDescription(ProductDescription, 100)}</p>
                    <motion.p 
                        className="text-lg font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        ${totalPrice.toFixed(2)}
                        <span className="text-xs text-gray-500 ml-2 line-through">${
                            Math.round(ProductPrice + (0.3 * ProductPrice))
                        }</span>
                    </motion.p>
                </CardContent>
                <CardFooter className="flex justify-between p-4">
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" /> Quick View
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>{ProductModelName}</DialogTitle>
                                <DialogDescription>
                                    <div className="flex gap-4">
                                        <div className="w-2/3">
                                            <div className="relative">
                                                <AnimatePresence mode="wait">
                                                    <motion.img 
                                                        key={currentImageIndex}
                                                        src={images[currentImageIndex]} 
                                                        alt={ProductModelName} 
                                                        className="w-full h-[400px] object-cover mb-4"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                </AnimatePresence>
                                                <Button variant="outline" size="icon" className="absolute top-1/2 left-2 transform -translate-y-1/2 rounded-full" onClick={prevImage}>
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="icon" className="absolute top-1/2 right-2 transform -translate-y-1/2 rounded-full" onClick={nextImage}>
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <StarRating rating={RatingAvg} totalRatings={TotalRatings} />
                                            <p className="text-sm text-gray-600 mb-2">{ProductDescription}</p>
                                            <motion.p 
                                                className="text-lg font-bold mb-4 text-gray-900"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                ${totalPrice.toFixed(2)}
                                                <span className="text-xs text-gray-500 ml-2 line-through">${
                                                    Math.round(ProductPrice + (0.3 * ProductPrice))
                                                }</span>
                                            </motion.p>
                                            <div className="flex items-center space-x-2 mb-4">
                                                <Checkbox
                                                    id="warranty"
                                                    checked={isWarrantySelected}
                                                    onCheckedChange={(checked) => setIsWarrantySelected(checked as boolean)}
                                                />
                                                <Label htmlFor="warranty">Add 2-year warranty for ${WARRANTY_PRICE}</Label>
                                            </div>
                                            {quantity === 0 ? (
                                                <Button onClick={handleAddToCart} className="w-full flex items-center justify-center p-3">
                                                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                                                </Button>
                                            ) : (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <Button onClick={handleRemoveFromCart} size="icon" variant="outline">
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="font-semibold">{quantity}</span>
                                                    <Button onClick={handleAddToCart} size="icon" variant="outline">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-1/3">
                                            <h4 className="font-semibold mb-2">Accessories</h4>
                                            {contents.length === 0 && (
                                                <p className="text-gray-600 text-xs">No accessories available for this product.</p>
                                            )}
                                            <ScrollArea className="h-[400px] w-full">
                                                {contents.map((accessory, i) => (
                                                    <motion.div 
                                                        key={i} 
                                                        className="flex items-center justify-between space-x-2 mb-4 text-left"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                    >
                                                        <img src={accessory?.ProductImage || `image${Math.floor(Math.random() * (14) + 1)}.jpg`} alt={accessory?.ProductModelName} className="w-16 h-16 object-cover" />
                                                        <div>
                                                            <p className="font-semibold line-clamp-1">{accessory?.ProductModelName}</p>
                                                            <p className="text-sm">${accessory?.ProductPrice?.toFixed?.(2)}</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className='ml-auto'
                                                            onClick={() => toggleAccessory(accessory.ProductID)}
                                                            variant={selectedAccessories.includes(accessory.ProductID) ? "destructive" : "default"}
                                                        >
                                                            {selectedAccessories.includes(accessory.ProductID) ? 'Remove' : 'Add'}
                                                        </Button>
                                                    </motion.div>
                                                ))}
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                    {quantity === 0 ? (
                        <Button onClick={handleAddToCart} className="flex items-center">
                            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                        </Button>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Button onClick={handleRemoveFromCart} size="icon" variant="outline">
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold">{quantity}</span>
                            <Button onClick={handleAddToCart} size="icon" variant="outline">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    )
}