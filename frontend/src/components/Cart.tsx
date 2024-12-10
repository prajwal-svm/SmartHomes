import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

const IMG = 'https://images.ctfassets.net/a3peezndovsu/4UGQZPM2YHuSmgWnmIKy19/0fdec7f45af66701a5f5be7552543976/variant-31961410175065.jpg'

export default function Cart({ products }) {

    const [cartItems, setCartItems] = useState(
        Object.entries(JSON.parse(sessionStorage.getItem('user'))?.cart || {}).reduce((acc, [key, value]) => {
            const product = products.find(product => product.ProductID === +key);
            if (product) {
                acc[product.ProductID] = {
                    ...value,
                    ...product
                };
            }
            return acc;
        }, {})
    )

    const updateQuantity = (id: number | string, quantity: number) => {
        const total = (cartItems[id]?.quantity || 0) + quantity;
        console.log({ total, id, cartItems, quantity });
        if (total === 0) {
            const newCart = { ...cartItems };
            delete newCart[id];
            const user = JSON.parse(sessionStorage.getItem('user'));
            user.cart = newCart;
            sessionStorage.setItem('user', JSON.stringify(user));
            setCartItems(newCart)
            return;
        }
        const newCart = {
            ...cartItems,
            [id]: {
                ...cartItems[id],
                quantity: total
            }
        };
        const user = JSON.parse(sessionStorage.getItem('user'));
        user.cart = newCart;
        sessionStorage.setItem('user', JSON.stringify(user));
        setCartItems(newCart)
    }

    const subtotal = Object.values(cartItems).reduce((sum, item) => sum + item.ProductPrice * item.quantity, 0)

    const total = (subtotal * 1.3).toFixed(2)

    console.log({ cartItems })

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
            {Object.keys(cartItems).length === 0 ? (
                <div className="text-center py-8">
                    <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                    <h2 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h2>
                    <p className="mt-1 text-sm text-gray-500">Start shopping to add items to your cart.</p>
                    <div className="mt-6">
                        <Button asChild>
                            <Link to="/">Start Shopping</Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {Object.values(cartItems).map((item, index) => (
                            <Card key={item.ProductID || index}>
                                <CardContent className="p-6 text-left">
                                    <div className="flex flex-col md:flex-row gap-6 max-h-[200px]">
                                        <div className="w-1/8">
                                            <img
                                                src={item.ProductImage ? `/${item.ProductImage}` : `image${Math.floor(Math.random() * (14) + 1)}.jpg`}
                                                alt={item.ProductModelName}
                                                width="120"
                                                height="120"
                                                className=" h-auto object-cover rounded-md"
                                                onError={(event) => {
                                                    event.target.src = IMG;
                                                }}
                                            />
                                        </div>
                                        <div className="w-full space-y-4">
                                            <div className="flex justify-end relative cursor-pointer">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Trash
                                                                className="h-4 w-4 text-gray-500 cursor-pointer absolute top-0 right-0 hover:text-red-500"
                                                                onClick={() => updateQuantity(item.ProductID, -item.quantity)}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Remove item from cart</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-semibold">{item.ProductModelName}</h2>
                                                <p className="text-gray-600 line-clamp-2">{item.ProductDescription}</p>
                                                <div className="flex items-center">
                                                    {Array.from({ length: 5 }, (_, index) => (
                                                        <span key={index} className={index < item.RatingAvg ? "text-yellow-400" : "text-gray-300"}>
                                                            ★
                                                        </span>
                                                    ))}
                                                    <span className="ml-2 text-xs text-gray-500 text-muted-foreground">{item.TotalRatings} reviews</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        onClick={() => updateQuantity(item.ProductID, -1)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="font-medium">{item.quantity}</span>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        onClick={() => updateQuantity(item.ProductID, 1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="text-xl font-semibold">
                                                    ${(item.ProductPrice * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">

                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Items Total</span>
                                    <span className='line-through'>${
                                        total
                                    }</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Items Discount</span>
                                    <span className='line-through'>${
                                        (total - subtotal).toFixed(2)
                                    }</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Estimated total ({
                                        Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0)
                                    } items)</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Taxes and shipping calculated at checkout</span>
                                </div>
                            </div>
                        </CardContent>
                        <Separator />
                        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
                            <Button asChild variant="outline" className="w-full sm:w-auto">
                                <Link to="/" className="flex items-center">
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Continue Shopping
                                </Link>
                            </Button>
                            <Button asChild className="w-full sm:w-auto">
                                <Link to="/checkout" className="flex items-center">
                                    Proceed to Checkout
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </>
            )}
        </div>
    )
}