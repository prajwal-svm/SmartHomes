import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, Plus, Pencil, Trash2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

export default function Customers() {
    const { toast } = useToast()
    const [customers, setCustomers] = useState([])
    const [orders, setOrders] = useState([])
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false)
    const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false)
    const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [newOrder, setNewOrder] = useState({
        CustomerID: '',
        ProductID: '',
        Quantity: 1,
        Price: '',
        ShippingCost: '',
        Discount: 0,
        TotalSales: '',
        OrderStatus: 'Pending',
        ShippingAddressStreet: '',
        ShippingAddressCity: '',
        ShippingAddressState: '',
        ShippingAddressZipCode: '',
        CreditCardNumber: ''
    })

    const fetchCustomers = async () => {
        try {
            const response = await fetch('http://localhost:8080/SmartHomes/users')
            const data = await response.json()
            setCustomers(data.filter((user) => user.UserType === 'Customer'))
        } catch (error) {
            console.error('Fetch customers error:', error)
        }
    }

    const fetchOrders = async () => {
        try {
            const response = await fetch(`http://localhost:8080/SmartHomes/orders`)
            const data = await response.json()
            setOrders(data.orders)
        } catch (error) {
            console.error('Fetch orders error:', error)
        }
    }

    useEffect(() => {
        fetchCustomers()
        fetchOrders()
    }, [])

    const handleViewOrders = (customer) => {
        setSelectedCustomer(customer)
        setIsOrdersModalOpen(true)
    }

    const handleAddCustomer = async (event) => {
        event.preventDefault()
        const form = event.target
        const formData = new FormData(form)
        const formObject = Object.fromEntries(formData)
        const data = {
            UserType: 'Customer',
            PasswordHash: 'hash1',
            FullName: formObject.FullName,
            Email: formObject.Email,
            Username: formObject.Email,
            ZipCode: formObject.ZipCode,
            City: formObject.City,
            State: formObject.State,
            Street: formObject.Street,
            PhoneNumber: formObject.PhoneNumber
        }

        try {
            const response = await fetch('http://localhost:8080/SmartHomes/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            await response.json()
            toast({
                title: 'Customer added successfully',
                description: 'Customer has been added successfully',
                variant: 'success',
            })
            setIsCustomerModalOpen(false)
            await fetchCustomers()
        } catch (error) {
            console.error('Error adding user:', error)
            toast({
                title: 'Error adding customer',
                description: 'An error occurred while adding the customer',
                variant: 'destructive',
            })
        }
    }

    const handleAddOrder = async (event) => {
        event.preventDefault()

        const orderToSubmit = {
            ...newOrder,
            CustomerID: selectedCustomer.UserID,
            PurchaseDate: new Date().toISOString(),
            TotalSales: parseFloat(newOrder.Price) + parseFloat(newOrder.ShippingCost) - parseFloat(newOrder.Discount)
        }

        try {
            const response = await fetch('http://localhost:8080/SmartHomes/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderToSubmit),
            })
            await response.json()
            toast({
                title: 'Order added successfully',
                description: 'Order has been added successfully',
                variant: 'success',
            })
            setIsAddOrderModalOpen(false)
            await fetchOrders()
        } catch (error) {
            console.error('Error adding order:', error)
            toast({
                title: 'Error adding order',
                description: 'An error occurred while adding the order',
                variant: 'destructive',
            })
        }
    }

    const handleEditOrder = async (event) => {
        event.preventDefault()

        try {
            const response = await fetch(`http://localhost:8080/SmartHomes/orders/${selectedOrder.OrderID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selectedOrder),
            })
            await response.json()
            toast({
                title: 'Order updated successfully',
                description: 'Order has been updated successfully',
                variant: 'success',
            })
            setIsEditOrderModalOpen(false)
            await fetchOrders()
        } catch (error) {
            console.error('Error updating order:', error)
            toast({
                title: 'Error updating order',
                description: 'An error occurred while updating the order',
                variant: 'destructive',
            })
        }
    }

    const handleDeleteOrder = async (orderId) => {
        try {
            await fetch(`http://localhost:8080/SmartHomes/orders/${orderId}`, {
                method: 'DELETE',
            })
            toast({
                title: 'Order deleted successfully',
                description: 'Order has been deleted successfully',
                variant: 'success',
            })
            await fetchOrders()
        } catch (error) {
            console.error('Error deleting order:', error);
            toast({
                title: 'Error deleting order',
                description: 'An error occurred while deleting the order',
                variant: 'destructive',
            })
        }
    }

    return (
        <>
            <Card>
                <CardHeader className="px-7 text-left relative">
                    <Link to="/" className="flex items-center gap-2 text-blue-600 hover:underline mb-2">
                        <ChevronLeft className='w-4 h-4' />  Home
                    </Link>
                    <CardTitle>Customers</CardTitle>
                    <CardDescription>List of registered customers in your store.</CardDescription>
                    <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center w-fit absolute top-5 right-10 bg-black hover:bg-gray-800">
                                Add Customer
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl text-center mb-4">Add Customer</DialogTitle>
                                <form onSubmit={handleAddCustomer}>
                                    <CardContent className="flex-col space-y-4">
                                        <Label className="space-y-2">
                                            <span>Full Name</span>
                                            <Input name="FullName" type="text" required className="mt-1" />
                                        </Label>
                                        <Label className="space-y-2">
                                            <span>Email</span>
                                            <Input name="Email" type="email" required className="mt-1" />
                                        </Label>
                                        <Label className="space-y-2">
                                            <span>Phone Number</span>
                                            <Input name="PhoneNumber" type="tel" required className="mt-1" />
                                        </Label>
                                        <Label className="space-y-2">
                                            <span>Street</span>
                                            <Input name="Street" type="text" required className="mt-1" />
                                        </Label>
                                        <Label className="space-y-2">
                                            <span>City</span>
                                            <Input name="City" type="text" required className="mt-1" />
                                        </Label>
                                        <Label className="space-y-2">
                                            <span>State</span>
                                            <Input name="State" type="text" required className="mt-1" />
                                        </Label>
                                        <Label className="space-y-2">
                                            <span>Zip Code</span>
                                            <Input name="ZipCode" type="text" required className="mt-1" />
                                        </Label>
                                    </CardContent>
                                    <DialogFooter>
                                        <Button type="submit" className="w-full">Add Customer</Button>
                                    </DialogFooter>
                                </form>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table className="text-left">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.UserID}>
                                    <TableCell><div className="font-medium">{customer.FullName}</div></TableCell>
                                    <TableCell><div className="text-sm text-muted-foreground">{customer.Email}</div></TableCell>
                                    <TableCell>{customer.PhoneNumber}</TableCell>
                                    <TableCell>{customer.City}</TableCell>
                                    <TableCell>{customer.State}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="link" onClick={() => handleViewOrders(customer)}>View Orders</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isOrdersModalOpen} onOpenChange={setIsOrdersModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center mb-4">
                            Orders for "{selectedCustomer?.FullName}"
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        {orders.filter(order => order.CustomerID === selectedCustomer?.UserID).length ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Total Sales</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Purchase Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.filter(order => order.CustomerID === selectedCustomer?.UserID).map((order) => (
                                        <TableRow key={order.OrderID}>
                                            <TableCell>{order.OrderID}</TableCell>
                                            <TableCell>${order.TotalSales.toFixed(2)}</TableCell>
                                            <TableCell>{order.OrderStatus}</TableCell>
                                            <TableCell>{new Date(order.PurchaseDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" onClick={() => {
                                                    setSelectedOrder(order)
                                                    setIsEditOrderModalOpen(true)
                                                }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" onClick={() => handleDeleteOrder(order.OrderID)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center text-gray-500 flex-col">
                                <Package className="h-20 w-20 mx-auto text-gray-400 mb-2" />
                                <p className="text-xl">No orders found for this customer</p>
                                <p className="text-sm">Consider adding one?</p>
                                <br />
                                <Button onClick={() => setIsAddOrderModalOpen(true)} className="mb-4">
                                    <Plus className="mr-2 h-4 w-4" /> Add New Order
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddOrderModalOpen} onOpenChange={setIsAddOrderModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center mb-4">Add New Order</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddOrder}>
                        <div className="space-y-4">
                            <Label className="space-y-2">
                                <span>Product ID</span>
                                <Input
                                    type="number"
                                    value={newOrder.ProductID}
                                    onChange={(e) => setNewOrder({ ...newOrder, ProductID: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Quantity</span>
                                <Input
                                    type="number"
                                    value={newOrder.Quantity}
                                    onChange={(e) => setNewOrder({ ...newOrder, Quantity: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Price</span>
                                <Input
                                    type="number"
                                    value={newOrder.Price}
                                    onChange={(e) => setNewOrder({ ...newOrder, Price: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Shipping Cost</span>
                                <Input
                                    type="number"
                                    value={newOrder.ShippingCost}
                                    onChange={(e) => setNewOrder({ ...newOrder, ShippingCost: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Discount</span>
                                <Input
                                    type="number"
                                    value={newOrder.Discount}
                                    onChange={(e) => setNewOrder({ ...newOrder, Discount: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Order Status</span>
                                <Input
                                    type="text"
                                    value={newOrder.OrderStatus}
                                    onChange={(e) => setNewOrder({ ...newOrder, OrderStatus: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Shipping Address Street</span>
                                <Input
                                    type="text"
                                    value={newOrder.ShippingAddressStreet}
                                    onChange={(e) => setNewOrder({ ...newOrder, ShippingAddressStreet: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Shipping Address City</span>
                                <Input
                                    type="text"
                                    value={newOrder.ShippingAddressCity}
                                    onChange={(e) => setNewOrder({ ...newOrder, ShippingAddressCity: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Shipping Address State</span>
                                <Input
                                    type="text"
                                    value={newOrder.ShippingAddressState}
                                    onChange={(e) => setNewOrder({ ...newOrder, ShippingAddressState: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Shipping Address Zip Code</span>
                                <Input
                                    type="text"
                                    value={newOrder.ShippingAddressZipCode}
                                    onChange={(e) => setNewOrder({ ...newOrder, ShippingAddressZipCode: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Credit Card Number</span>
                                <Input
                                    type="text"
                                    value={newOrder.CreditCardNumber}
                                    onChange={(e) => setNewOrder({ ...newOrder, CreditCardNumber: e.target.value })}
                                    required
                                />
                            </Label>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="submit">Add Order</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOrderModalOpen} onOpenChange={setIsEditOrderModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center mb-4">Edit Order</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditOrder}>
                        <div className="space-y-4">
                            <Label className="space-y-2">
                                <span>Order ID</span>
                                <Input type="text" value={selectedOrder?.OrderID} disabled />
                            </Label>
                            <Label className="space-y-2">
                                <span>Total Sales</span>
                                <Input
                                    type="number"
                                    value={selectedOrder?.TotalSales}
                                    onChange={(e) => setSelectedOrder({ ...selectedOrder, TotalSales: parseFloat(e.target.value) })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Status</span>
                                <Input
                                    type="text"
                                    value={selectedOrder?.OrderStatus}
                                    onChange={(e) => setSelectedOrder({ ...selectedOrder, OrderStatus: e.target.value })}
                                    required
                                />
                            </Label>
                            <Label className="space-y-2">
                                <span>Shipping Cost</span>
                                <Input
                                    type="number"
                                    value={selectedOrder?.ShippingCost}
                                    onChange={(e) => setSelectedOrder({ ...selectedOrder, ShippingCost: parseFloat(e.target.value) })}
                                    required
                                />
                            </Label>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="submit">Update Order</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}