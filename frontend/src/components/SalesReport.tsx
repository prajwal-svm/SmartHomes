import { useEffect, useState } from 'react'
import { Chart } from "react-google-charts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Calendar, ChevronLeft, ChevronUp, ChevronDown, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProductSale {
    productName: string;
    productPrice: number;
    itemsSold: number;
    totalSales: number;
}

interface DailySale {
    date: string;
    totalSales: number;
}

interface SalesData {
    productSales: ProductSale[];
    dailySales: DailySale[];
}

type SortKey = 'productName' | 'productPrice' | 'itemsSold' | 'totalSales' | 'date';
type SortOrder = 'asc' | 'desc';

export default function SalesDashboard() {
    const [data, setData] = useState<SalesData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetch('http://localhost:8080/SmartHomes/products/sales-report')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok')
                }
                return response.json()
            })
            .then((apiData: SalesData) => {
                setData(apiData)
                setLoading(false)
            })
            .catch(error => {
                console.error('Error fetching sales data:', error)
                setError('Failed to load sales data. Please try again later.')
                setLoading(false)
            })
    }, [])

    const chartData = data ? [
        ["Product", "Total Sales"],
        ...data.productSales.map(product => [product.productName, product.totalSales])
    ] : []

    const chartOptions = {
        title: "Total Sales by Product",
        chartArea: { width: "50%" },
        hAxis: {
            title: "Total Sales ($)",
            minValue: 0,
        },
        vAxis: {
            title: "Product",
        },
        colors: ['#6366f1'],
        legend: { position: 'none' },
    }

    if (loading) {
        return (
            <div className="container mx-auto p-4 flex items-center justify-center h-screen">
                <motion.div
                    className="rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
            </div>
        )
    }

    if (error) {
        return <div className="container mx-auto p-4 text-red-500 text-center">{error}</div>
    }

    if (!data) {
        return <div className="container mx-auto p-4 text-center">No data available</div>
    }

    return (
        <motion.div
            className="container mx-auto p-4 space-y-8 min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="shadow-lg text-left">
                    <CardHeader className="bg-black text-white">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:text-blue-400 transition-colors"
                                asChild
                            >
                                <Link to="/" className="flex items-center gap-2">
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Home
                                </Link>
                            </Button>
                            <CardTitle className="text-center text-3xl font-bold">Sales Report</CardTitle>
                            <div className="w-[100px]"></div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Tabs defaultValue="products" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="products">Product Sales</TabsTrigger>
                                <TabsTrigger value="chart">Sales Chart</TabsTrigger>
                                <TabsTrigger value="daily">Daily Sales</TabsTrigger>
                            </TabsList>
                            <AnimatePresence mode="wait">
                                <TabsContent value="products">
                                    <ProductSalesTable sales={data.productSales} />
                                </TabsContent>
                                <TabsContent value="chart">
                                    <SalesChart data={chartData} options={chartOptions} />
                                </TabsContent>
                                <TabsContent value="daily">
                                    <DailySalesTable sales={data.dailySales} />
                                </TabsContent>
                            </AnimatePresence>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}

function ProductSalesTable({ sales }: { sales: ProductSale[] }) {
    const [sortedSales, setSortedSales] = useState<ProductSale[]>(sales)
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortOrder }>({ key: 'productName', direction: 'asc' })
    const [filter, setFilter] = useState('')

    useEffect(() => {
        const sortedData = [...sales]
        if (sortConfig.key) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sortedData.sort((a: any, b: any) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1
                }
                return 0
            })
        }
        setSortedSales(sortedData)
    }, [sales, sortConfig])

    const requestSort = (key: SortKey) => {
        let direction: SortOrder = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const filteredSales = sortedSales.filter(sale =>
        sale.productName.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart className="w-5 h-5" />
                        Product Sales
                    </CardTitle>
                    <div className="relative top-4">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 " />
                        <Input
                            type="text"
                            placeholder="Filter by product name"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </CardHeader>
                <CardContent className='mt-6'>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead onClick={() => requestSort('productName')} className="cursor-pointer">
                                    Product Name {sortConfig.key === 'productName' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
                                </TableHead>
                                <TableHead onClick={() => requestSort('productPrice')} className="cursor-pointer">
                                    Price {sortConfig.key === 'productPrice' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
                                </TableHead>
                                <TableHead onClick={() => requestSort('itemsSold')} className="cursor-pointer">
                                    Items Sold {sortConfig.key === 'itemsSold' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
                                </TableHead>
                                <TableHead onClick={() => requestSort('totalSales')} className="cursor-pointer">
                                    Total Sales {sortConfig.key === 'totalSales' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSales.map((sale, index) => (
                                <motion.tr
                                    key={sale.productName}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.1, delay: index * 0.01 }}
                                >
                                    <TableCell className="font-medium">{sale.productName}</TableCell>
                                    <TableCell>${sale.productPrice.toFixed(2)}</TableCell>
                                    <TableCell>{sale.itemsSold}</TableCell>
                                    <TableCell>${sale.totalSales.toFixed(2)}</TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SalesChart({ data, options }: { data: any[], options: any }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart className="w-5 h-5" />
                        Total Sales by Product
                    </CardTitle>
                </CardHeader>
                <CardContent className='p-0 overflow-scroll'>
                    <Chart
                        chartType="BarChart"
                        width="1400px"
                        height="1500px"
                        data={data}
                        options={options}
                        className='mt-[-200px]'
                    />
                </CardContent>
            </Card>
        </motion.div>
    )
}

function DailySalesTable({ sales }: { sales: DailySale[] }) {
    const [sortedSales, setSortedSales] = useState<DailySale[]>(sales)
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortOrder }>({ key: 'date', direction: 'asc' })
    const [filter, setFilter] = useState('')

    useEffect(() => {
        const sortedData = [...sales]
        if (sortConfig.key) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sortedData.sort((a: any, b: any) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1
                }
                return 0
            })
        }
        setSortedSales(sortedData)
    }, [sales, sortConfig])

    const requestSort = (key: SortKey) => {
        let direction: SortOrder = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const filteredSales = sortedSales.filter(sale =>
        sale.date.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Daily Sales
                    </CardTitle>
                    <div className="relative top-4">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Filter by date"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </CardHeader>
                <CardContent className='mt-6'>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead onClick={() => requestSort('date')} className="cursor-pointer">
                                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
                                </TableHead>
                                <TableHead onClick={() => requestSort('totalSales')} className="cursor-pointer">
                                    Total Sales {sortConfig.key === 'totalSales' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSales.map((sale, index) => (
                                <motion.tr
                                    key={sale.date}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.1, delay: index * 0.01 }}
                                >
                                    <TableCell className="font-medium">{sale.date}</TableCell>
                                    <TableCell>${sale.totalSales.toFixed(2)}</TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </motion.div>
    )
}