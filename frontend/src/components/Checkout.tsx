'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, CreditCard, MapPin, Truck, User } from 'lucide-react'
import Confetti from 'react-confetti'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export default function CheckoutPage({products}) {
    const [deliveryMethod, setDeliveryMethod] = useState('home')
    const [formData, setFormData] = useState({
        name: `${JSON.parse(localStorage.getItem('user'))?.FullName || ''}`,
        email: JSON.parse(localStorage.getItem('user'))?.Email || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        storeLocation: '',
        creditCardNumber: '',
        creditCardExpiry: '',
        creditCardCVC: '',
        billingAddress: '',
        billingCity: '',
        billingState: '',
        billingZipCode: '',
    })
    const [sameBillingAddress, setSameBillingAddress] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [confirmationNumber, setConfirmationNumber] = useState(Math.random().toString(36).substring(2, 11).toUpperCase())
    const [stores, setStores] = useState([]);

    const [cartItems, setCartItems] = useState(
        (Object.entries(JSON.parse(localStorage.getItem('user'))?.cart || {})).map(([key, value]) => ({
            ...value,
            price: products.find(product => +product.ProductID === +key)?.ProductPrice,
            ...products.find(product => +product.ProductID === +key)
        }))
    )

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const retailerDiscount = 0.1 * subtotal
    const manufacturerRebate = 0.05 * subtotal
    const totalAmount = subtotal - retailerDiscount - manufacturerRebate

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await  fetch('http://localhost:8080/SmartHomes/api/stores');
                const data = await response.json();
                setStores(data);
            } catch (error) {
                console.error('Error fetching stores:', error);
            }
        }
        fetchStores();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const orderData = {
            customerID: JSON.parse(localStorage.getItem('user'))?.CustomerID,
            storeID: deliveryMethod === 'store' ? formData.storeLocation : null,
            products: cartItems.map(item => ({
                productID: item.ProductID,
                quantity: item.quantity,
                price: item.price,
                discount: (item.price * item.quantity * 0.15).toFixed(2),
                shippingCost: deliveryMethod === 'home' ? 10 : 0, 
                totalAmount: (item.price * item.quantity * 0.85 + (deliveryMethod === 'home' ? 10 : 0)).toFixed(2)
            })),
            shippingStreet: deliveryMethod === 'home' ? formData.address : null,
            shippingCity: deliveryMethod === 'home' ? formData.city : null,
            shippingState: deliveryMethod === 'home' ? formData.state : null,
            shippingZipCode: deliveryMethod === 'home' ? formData.zipCode : null,
            storeStreet: deliveryMethod === 'store' ? stores.find(store => store.StoreID.toString() === formData.storeLocation)?.Street || '123 Main St' : null,
            storeCity: deliveryMethod === 'store' ? stores.find(store => store.StoreID.toString() === formData.storeLocation)?.City || 'Chicago' : null,
            storeState: deliveryMethod === 'store' ? stores.find(store => store.StoreID.toString() === formData.storeLocation)?.State || 'Illinois' : null,
            storeZipCode: deliveryMethod === 'store' ? stores.find(store => store.StoreID.toString() === formData.storeLocation)?.ZipCode || '60601' : null,
            creditCardNumber: formData.creditCardNumber
        }

        try {
            const response = await fetch('http://localhost:8080/SmartHomes/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            })

            if (response.ok) {
                const responseData = await response.json()
                console.log('Order placed successfully:', responseData)
                setConfirmationNumber((responseData.orderId || '').split('-')[0].toUpperCase())
                setIsModalOpen(true)
                setShowConfetti(true)

                // Clear the cart
                const user = JSON.parse(localStorage.getItem('user'))
                user.cart = {}
                localStorage.setItem('user', JSON.stringify(user))
            } else {
                console.error('Failed to place order')
            }
        } catch (error) {
            console.error('Error placing order:', error)
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setShowConfetti(false)
        window.location.href = '/'
    }

    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 14)

    return (
        <div className="container mx-auto px-4 py-8 text-left">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            <form onSubmit={handleSubmit}>
                <Accordion type="single" collapsible className="w-full">
                    {/* Delivery Method */}
                    <AccordionItem value="delivery-method">
                        <AccordionTrigger>
                            <div className="flex items-center">
                                <Truck className="mr-2 h-4 w-4" />
                                Delivery Method
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6">
                            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="home" id="home-delivery" />
                                    <Label htmlFor="home-delivery">Home Delivery</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="store" id="store-pickup" />
                                    <Label htmlFor="store-pickup">In-Store Pickup</Label>
                                </div>
                            </RadioGroup>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Personal Information */}
                    <AccordionItem value="personal-info">
                        <AccordionTrigger>
                            <div className="flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                Personal Information
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required  disabled={JSON.parse(localStorage.getItem('user'))?.firstName} />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        disabled={JSON.parse(localStorage.getItem('user'))?.email}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Address */}
                    <AccordionItem value="address">
                        <AccordionTrigger>
                            <div className="flex items-center">
                                <MapPin className="mr-2 h-4 w-4" />
                                {deliveryMethod === 'home' ? 'Delivery Address' : 'Pickup Location'}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6">
                            {deliveryMethod === 'home' ? (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="address">Street Address</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="state">State</Label>
                                            <Input
                                                id="state"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="zipCode">Zip Code</Label>
                                        <Input
                                            id="zipCode"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="zipCode">Your Zip Code</Label>
                                        <Input
                                            id="zipCode"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="storeLocation">Store Location for Pickup</Label>
                                        <Select
                                            value={formData.storeLocation}
                                            onValueChange={value => setFormData({ ...formData, storeLocation: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a store location" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stores.map(store => (
                                                    <SelectItem key={store.StoreID} value={store.StoreID.toString()}>
                                                        {store.StoreName} - {store.Street}, {store.City}, {store.State} ({store.ZipCode})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>

                    {/* Payment */}
                    <AccordionItem value="payment">
                        <AccordionTrigger>
                            <div className="flex items-center">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Payment Information
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="creditCardNumber">Credit Card Number</Label>
                                    <Input
                                        id="creditCardNumber"
                                        name="creditCardNumber"
                                        value={formData.creditCardNumber}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="creditCardExpiry">Expiration Date</Label>
                                        <Input
                                            id="creditCardExpiry"
                                            name="creditCardExpiry"
                                            placeholder="MM/YY"
                                            value={formData.creditCardExpiry}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="creditCardCVC">CVC</Label>
                                        <Input
                                            id="creditCardCVC"
                                            name="creditCardCVC"
                                            value={formData.creditCardCVC}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="sameBillingAddress"
                                        checked={sameBillingAddress}
                                        onCheckedChange={checked => setSameBillingAddress(checked as boolean)}
                                    />
                                    <Label htmlFor="sameBillingAddress">Billing address same as shipping</Label>
                                </div>
                                {!sameBillingAddress && (
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="billingAddress">Billing Address</Label>
                                            <Input
                                                id="billingAddress"
                                                name="billingAddress"
                                                value={formData.billingAddress}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="billingCity">City</Label>
                                                <Input
                                                    id="billingCity"
                                                    name="billingCity"
                                                    value={formData.billingCity}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="billingState">State</Label>
                                                <Input
                                                    id="billingState"
                                                    name="billingState"
                                                    value={formData.billingState}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="billingZipCode">Zip Code</Label>
                                            <Input
                                                id="billingZipCode"
                                                name="billingZipCode"
                                                value={formData.billingZipCode}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Retailer Special Discount</span>
                                <span>-${retailerDiscount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Manufacturer Rebate</span>
                                <span>-${manufacturerRebate.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span>Total</span>
                                <span>${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={
                            subtotal.toFixed(2) < 1 || !formData.name || !formData.email || !formData.phone || !formData.creditCardNumber || !formData.creditCardExpiry || !formData.creditCardCVC || (deliveryMethod === 'home' && (!formData.address || !formData.city || !formData.state || !formData.zipCode)) || (deliveryMethod === 'store' && (!formData.storeLocation || !formData.zipCode))
                        }>
                            Place Order
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px] text-left">
                    <DialogHeader>
                        <DialogTitle>Order Confirmation  <span className='text-blue-700'>#{confirmationNumber}</span></DialogTitle>
                        <p className="text-sm text-gray-600 mb-4">
                            Your order has been placed and will be available for delivery/pickup by {deliveryDate.toDateString()}.
                        </p>
                    </DialogHeader>
                    <div className="grid gap-2 py-4 text-left space-y-2 bg-gray-100 p-4 rounded-lg">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-left text-xs">Name</Label>
                            <span className="col-span-3 text-bold">{formData.name}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-left text-xs">Email</Label>
                            <span className="col-span-3">{formData.email}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-left text-xs">Phone</Label>
                            <span className="col-span-3">{formData.phone}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-left text-xs">Method</Label>
                            <span className="col-span-3">{deliveryMethod === 'home' ? 'Home Delivery' : 'In-Store Pickup'}</span>
                        </div>
                        {deliveryMethod === 'home' ? (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-left text-xs">Address</Label>
                                <span className="col-span-3">{`${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`}</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-left text-xs">Pickup Location</Label>
                                <span className="col-span-3">
                                    {stores.find(store => store.StoreID.toString() === formData.storeLocation)?.StoreName}
                                </span>
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-left text-xs">Payment</Label>
                            <span className="col-span-3">Credit Card ending in {formData.creditCardNumber.slice(-4)}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-left">Total</Label>
                            <span className="col-span-3">${totalAmount.toFixed(2)}</span>
                        </div>
                        </div>
                        <div>
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold">Order Items</h3>
                            <ul className='space-y-2 bg-gray-100 p-4 rounded-lg'>
                                {cartItems.map(item => (
                                    <li key={item.id} className="flex justify-between">
                                        <span>
                                            {item.ProductModelName} x {item.quantity}
                                        </span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={closeModal}>Continue Shopping</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showConfetti && (
                <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} />
            )}
        </div>
    )
}
