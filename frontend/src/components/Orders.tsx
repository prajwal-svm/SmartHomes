'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { AlertCircle, CheckCircle, ChevronLeft, Clock, Package, Truck, MapPin, CreditCard, ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from "@/components/ui/label"
import { Link } from 'react-router-dom'
import { useToast } from "@/hooks/use-toast"

type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'

interface OrderItem {
    ProductID: string
    Quantity: string
    Price: string
    Review?: Review
}

interface Order {
    OrderID: string
    CustomerID: number
    PurchaseDate: string
    OrderStatus: OrderStatus
    ShipDate: string
    StoreAddressStreet: string
    StoreAddressCity: string
    StoreAddressState: string
    StoreAddressZipCode: string
    ShippingAddressStreet: string
    ShippingAddressCity: string
    ShippingAddressState: string
    ShippingAddressZipCode: string
    ShippingCost: string
    TotalSales: string
    products: OrderItem[]
}

interface Product {
    ProductID: string
    ProductModelName: string
    ProductCategory: string
    ProductPrice: string
    OnSale: boolean
    ManufacturerName: string
    ManufacturerRebate: boolean
    ProductImage: string
}

interface Review {
    productId: string
    ProductModelName: string
    ProductCategory: string
    ProductPrice: string
    StoreID: string
    StoreZip: string
    StoreCity: string
    StoreState: string
    ProductOnSale: string
    ManufacturerName: string
    ManufacturerRebate: string
    UserID: string
    UserAge: number
    UserGender: string
    UserOccupation: string
    ReviewRating: number
    ReviewDate: string
    ReviewText: string
}

interface User {
    CustomerID: number
    Age: number
    Gender: string
    Occupation: string
}

export default function OrdersView({ products }: { products: Product[] }) {
    const [orders, setOrders] = useState<{ [key: string]: Order }>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reviewForm, setReviewForm] = useState<Review | null>(null)
    const [selectedRating, setSelectedRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [user, _] = useState<User>(JSON.parse(localStorage.getItem('user') || '{}'))

    const { toast } = useToast()

    useEffect(() => {
        fetchOrders()
    }, [])

    const productIdsMap = products.reduce((acc, product) => {
        acc[product.ProductID] = product;
        return acc;
    }, {} as { [key: string]: Product });

    const fetchOrders = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('http://localhost:8080/SmartHomes/api/transactions')
            const reviewResponse = await fetch('http://localhost:8080/SmartHomes/api/productReviews')
            const data = await response.json()
            const { productReviews: allReviews } = await reviewResponse.json()
            const userReviews = allReviews.filter((review: Review) => +review.userID === +user.CustomerID)
            if (data) {
                const userOrders = data
                    .filter((order: Order) => +order.CustomerID === +user.CustomerID)
                    .reduce((acc: { [key: string]: Order[] }, order: Order) => {
                        if (!acc[order.OrderID]) {
                            acc[order.OrderID] = [];
                        }
                        acc[order.OrderID].push(order);
                        return acc;
                    }, {})
                const finalOrders = Object.entries(userOrders).reduce((acc, [orderId, orders]) => {
                    const commonDetails = { ...orders[0] };
                    const productDetails = orders.map(order => ({
                        ProductID: order.ProductID,
                        Quantity: order.Quantity,
                        Price: order.Price,
                        Review: userReviews.find((review: Review) => +review.productId === +order.ProductID)
                    }));
                    acc[orderId] = { ...commonDetails, products: productDetails };
                    return acc;
                }, {} as { [key: string]: Order });
                setOrders(finalOrders)
            } else {
                setError('Failed to fetch orders')
            }
        } catch (err) {
            console.error(err)
            setError('An error occurred while fetching orders')
        } finally {
            setIsLoading(false)
        }
    }

    const cancelOrder = async (orderId: string) => {
        try {
            const response = await fetch('http://localhost:8080/SmartHomes/cancelOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId }),
            })
            const data = await response.json()
            if (data.success) {
                fetchOrders()
            } else {
                setError('Failed to cancel order')
            }
        } catch (err) {
            console.error(err)
            setError('An error occurred while cancelling the order')
        }
    }

    const isCancelAllowed = (order: Order) => {
        const orderDate = new Date(order.PurchaseDate);
        const deliveryDate = new Date(orderDate);
        deliveryDate.setDate(deliveryDate.getDate() + 14);
        const today = new Date();
        const fiveBusinessDays = 5;
        let businessDays = 0;
        while (businessDays < fiveBusinessDays) {
            deliveryDate.setDate(deliveryDate.getDate() + 1);
            if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
                businessDays++;
            }
        }
        return today < deliveryDate;
    }

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />
            case 'Processing': return <Package className="w-4 h-4 text-blue-500" />
            case 'Shipped': return <Truck className="w-4 h-4 text-purple-500" />
            case 'Delivered': return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'Cancelled': return <AlertCircle className="w-4 h-4 text-red-500" />
            default: return null
        }
    }

    const handleReviewSubmit = async (e: React.FormEvent, item: OrderItem, order: Order) => {
        e.preventDefault()
        if (!reviewForm) return

        const product = productIdsMap[item.ProductID]

        try {
            const response = await fetch('http://localhost:8080/SmartHomes/api/productReviews/?action=create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: product.ProductID,
                    productModelName: product?.ProductModelName || '',
                    productCategory: product?.ProductCategory || '',
                    productPrice: product?.ProductPrice || '',
                    storeID: `SmartPortables of ${order.StoreAddressCity}`,
                    storeZip: order.StoreAddressZipCode,
                    storeCity: order.StoreAddressCity,
                    storeState: order.StoreAddressState,
                    productOnSale: 'Yes',
                    manufacturerName: product?.ManufacturerName || '',
                    manufacturerRebate: product?.ManufacturerRebate ? 'Yes' : 'No',
                    userID: user.CustomerID.toString(),
                    userAge: user.Age,
                    userGender: user.Gender,
                    userOccupation: user.Occupation,
                    reviewRating: selectedRating,
                    reviewDate: reviewForm.ReviewDate || format(new Date(), 'yyyy-MM-dd'),
                    reviewText: reviewForm.ReviewText
                }),
            })
            const data = await response.json()
            if (data.insertedId) {
                setReviewForm(null)
                setSelectedRating(0)
                fetchOrders()
                toast({
                    title: 'Thanks for your feedback!',
                    description: 'Your review has been submitted successfully',
                    variant: 'default',
                })
            } else {
                setError('Failed to submit review: ' + (data.error || 'Unknown error'))
            }
        } catch (err) {
            console.error(err)
            setError('An error occurred while submitting the review: ' + err.message)
        }
    }

    const handleStarHover = (rating: number) => {
        setHoveredRating(rating)
    }

    const handleStarLeave = () => {
        setHoveredRating(0)
    }

    const handleStarClick = (rating: number) => {
        setSelectedRating(rating)
        handleReviewFormChange('ReviewRating', rating)
    }

    const handleReviewFormChange = (field: keyof Review, value: string | number | boolean) => {
        setReviewForm(prev => {
            return { ...prev, [field]: value }
        })
    }

    const getColor = (status: OrderStatus) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100'
            case 'Processing': return 'bg-blue-100'
            case 'Shipped': return 'bg-purple-100'
            case 'Delivered': return 'bg-green-100'
            case 'Cancelled': return 'bg-red-100'
            default: return 'bg-gray-100'
        }
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading orders...</div>
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Link to="/" className="flex items-center gap-2 text-blue-600 hover:underline mb-4">
                <ChevronLeft className="w-4 h-4" />
                Back to Home
            </Link>
            <h1 className="text-3xl font-bold mb-8">Your Orders</h1>
            {Object.keys(orders).length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-40">
                        <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-xl text-gray-600">You have no orders yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.values(orders).map((order) => (
                        <Card key={order.OrderID} className="w-full mx-auto">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">Order #{order.OrderID.split('-')[0].toUpperCase()}</span>
                                        <Badge variant="outline" className={getColor(order.OrderStatus)}>
                                            <span className="flex items-center gap-1 text-sm">
                                                {getStatusIcon(order.OrderStatus)}
                                                {order.OrderStatus}
                                            </span>
                                        </Badge>
                                    </div>
                                    {order.OrderStatus === 'Pending' && isCancelAllowed(order) && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive" size="sm" className="rounded-full">Cancel Order</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Cancel Order</DialogTitle>
                                                    <DialogDescription>
                                                        Are you sure you want to cancel this order? This action cannot be undone.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => { }}>No, keep order</Button>
                                                    <Button variant="destructive" onClick={() => cancelOrder(order.OrderID)}>Yes, cancel order</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-left">
                                    Placed on {format(new Date(order.PurchaseDate), 'MMMM d, yyyy')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-left">
                                <div className="space-y-6">
                                    {order.OrderStatus === 'Delivered' && (
                                        <>
                                            <div className="flex items-center gap-4">
                                                <Truck className="w-6 h-6 text-green-500" />
                                                <div>
                                                    <h3 className="text-lg font-semibold">Shipped on</h3>
                                                    <p>{format(new Date(order.ShipDate), 'MMMM d, yyyy')}</p>
                                                </div>
                                            </div>
                                            <Separator />
                                        </>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {order.ShippingAddressZipCode != "null" ? <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-blue-500" />
                                                <h3 className="text-lg font-semibold">Shipping Address</h3>
                                            </div>
                                            <p className="text-sm text-gray-600 ml-8">
                                                {order.ShippingAddressStreet},<br />
                                                {order.ShippingAddressCity}, {order.ShippingAddressState} {order.ShippingAddressZipCode}
                                            </p>
                                        </div> : <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-blue-500" />
                                                <h3 className="text-lg font-semibold">Store Address</h3>
                                            </div>
                                            <p className="text-sm text-gray-600 ml-8">
                                                {order.StoreAddressStreet},<br />
                                                {order.StoreAddressCity}, {order.StoreAddressState} {order.StoreAddressZipCode}
                                            </p>
                                        </div>
                                        }
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-green-500" />
                                            <h3 className="text-lg font-semibold">Shipping Cost</h3>
                                        </div>
                                        <p className="text-lg font-bold">${order.ShippingCost}</p>
                                    </div>
                                    <Accordion type="single" collapsible className="mt-6">
                                        <AccordionItem value="items">
                                            <AccordionTrigger>Order Items</AccordionTrigger>
                                            <AccordionContent>
                                                <ScrollArea className="h-[200px]">
                                                    <ul className="space-y-2">
                                                        {order.products.map((item) => (
                                                            <li key={item.ProductID} className="flex justify-between items-center py-2">
                                                                <span className="text-sm">{productIdsMap[item.ProductID]?.ProductModelName || 'Unknown Product'}</span>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-sm text-gray-600">Qty: {item.Quantity}</span>
                                                                    <span className="font-semibold">${(parseFloat(item.Price) * parseInt(item.Quantity)).toFixed(2)}</span>
                                                                    {order.OrderStatus === 'Delivered' && (
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button className='bg-indigo-500 text-white hover:bg-indigo-600 rounded-full' size="sm">
                                                                                    {item.Review ? 'View Review' : 'Leave a Review'}
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="max-w-3xl">
                                                                                <DialogHeader>
                                                                                    <DialogTitle>{item.Review ? 'Your Review' : 'Leave a Review'}</DialogTitle>
                                                                                    <DialogDescription>
                                                                                        {item.Review ? 'Here\'s your review for' : 'Share your thoughts about'} {productIdsMap[item.ProductID]?.ProductModelName || 'this product'}
                                                                                    </DialogDescription>
                                                                                </DialogHeader>
                                                                                {item.Review ? (
                                                                                    <div className="space-y-4">
                                                                                        <div>
                                                                                            <Label>Review Rating</Label>
                                                                                            <div className="flex items-center gap-2">
                                                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                                                    <Star
                                                                                                        key={star}
                                                                                                        className={`w-6 h-6 ${star <= item.Review!.reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                                                                    />
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label>Review Date</Label>
                                                                                            <p className="text-sm text-gray-600">{format(new Date(item.Review!.reviewDate), 'MMMM d, yyyy')}</p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label>Review Text</Label>
                                                                                            <p className="text-sm text-gray-600">{item.Review.reviewText}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <form onSubmit={(e) => handleReviewSubmit(e, item, order)} className="space-y-4">
                                                                                        <div className="grid grid-cols-2 gap-4">
                                                                                            <div>
                                                                                                <Label>Product Model Name</Label>
                                                                                                <p className="text-sm text-gray-600">{productIdsMap[item.ProductID]?.ProductModelName}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label>Product Category</Label>
                                                                                                <p className="text-sm text-gray-600">{productIdsMap[item.ProductID]?.ProductCategory}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label>Product Price</Label>
                                                                                                <p className="text-sm text-gray-600">${productIdsMap[item.ProductID]?.ProductPrice}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label>Store ID</Label>
                                                                                                <p className="text-sm text-gray-600">{`SmartPortables of ${order.StoreAddressCity}`}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label>Store Zip</Label>
                                                                                                <p className="text-sm text-gray-600">{order.StoreAddressZipCode}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label>Store City</Label>
                                                                                                <p className="text-sm text-gray-600">{order.StoreAddressCity}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label>Store State</Label>
                                                                                                <p className="text-sm text-gray-600">{order.StoreAddressState}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label>Product On Sale</Label>
                                                                                                <p className="text-sm text-gray-600">{productIdsMap[item.ProductID]?.OnSale ? 'Yes' : 'No'}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label>Manufacturer Name</Label>
                                                                                                <p className="text-sm text-gray-600">{productIdsMap[item.ProductID]?.ManufacturerName}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <Label>Manufacturer Rebate</Label>
                                                                                                <p className="text-sm text-gray-600">{productIdsMap[item.ProductID]?.ManufacturerRebate ? 'Yes' : 'No'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label htmlFor="ReviewRating">Review Rating</Label>
                                                                                            <div className="flex items-center gap-2">
                                                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                                                    <button
                                                                                                        key={star}
                                                                                                        type="button"
                                                                                                        onClick={() => handleStarClick(star)}
                                                                                                        onMouseEnter={() => handleStarHover(star)}
                                                                                                        onMouseLeave={handleStarLeave}
                                                                                                        className={`text-2xl transition-colors duration-200 ${(hoveredRating || selectedRating) >= star ? 'text-yellow-400' : 'text-gray-300'
                                                                                                            }`}
                                                                                                    >
                                                                                                        <Star
                                                                                                            className="w-6 h-6"
                                                                                                            fill={(hoveredRating || selectedRating) >= star ? 'currentColor' : 'none'}
                                                                                                        />
                                                                                                    </button>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label htmlFor="ReviewDate">Review Date</Label>
                                                                                            <Input
                                                                                                id="ReviewDate"
                                                                                                type="date"
                                                                                                value={reviewForm?.ReviewDate || format(new Date(), 'yyyy-MM-dd')}
                                                                                                onChange={(e) => handleReviewFormChange('ReviewDate', e.target.value)}
                                                                                                required
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label htmlFor="ReviewText">Review Text</Label>
                                                                                            <Textarea
                                                                                                id="ReviewText"
                                                                                                value={reviewForm?.ReviewText || ''}
                                                                                                onChange={(e) => handleReviewFormChange('ReviewText', e.target.value)}
                                                                                                required
                                                                                            />
                                                                                        </div>
                                                                                        <DialogFooter>
                                                                                            <Button type="submit">Submit Review</Button>
                                                                                        </DialogFooter>
                                                                                    </form>
                                                                                )}
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    )}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </ScrollArea>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                    <div className="mt-4 flex justify-between items-center bg-gray-100 p-4 rounded-md">
                                        <span className="font-semibold text-lg">Total Amount:</span>
                                        <span className="text-xl font-bold">${order.TotalSales}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}