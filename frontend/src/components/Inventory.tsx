import React, { useEffect, useState } from 'react'
import { Chart } from "react-google-charts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from 'react-router-dom'
import { ChevronLeft, BarChart, Tag, Gift, ChevronUp, ChevronDown, Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Product {
  ProductModelName: string;
  ProductPrice: number;
  Inventory: number;
}

interface ApiResponse {
  productsOnSale: Product[];
  allProducts: Product[];
  productsWithRebate: Product[];
}

type SortKey = 'ProductModelName' | 'ProductPrice' | 'Inventory';
type SortOrder = 'asc' | 'desc';

export default function ProductDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:8080/SmartHomes/products/inventory')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json()
      })
      .then((data: ApiResponse) => {
        setData(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching products:', error)
        setError('Failed to load products. Please try again later.')
        setLoading(false)
      })
  }, [])

  const chartData = data ? [
    ["Product", "Available Items"],
    ...data.allProducts.map(product => [product.ProductModelName, product.Inventory])
  ] : []

  const chartOptions = {
    title: "Product Availability",
    chartArea: { width: "50%" },
    hAxis: {
      title: "Available Items",
      minValue: 0,
    },
    vAxis: {
      title: "Product",
    },
    colors: ['#65a30d'],
    legend: { position: 'none' },
  }

  if (loading) {
    return <div className="container mx-auto p-4 flex items-center justify-center h-screen">
      <motion.div 
        className="rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
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
              <CardTitle className="text-center text-3xl font-bold">Inventory</CardTitle>
              <div className="w-[100px]"></div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all">All Products</TabsTrigger>
                <TabsTrigger value="chart">Availability Chart</TabsTrigger>
                <TabsTrigger value="sale">On Sale</TabsTrigger>
                <TabsTrigger value="rebate">With Rebates</TabsTrigger>
              </TabsList>
              <AnimatePresence mode="wait">
                <TabsContent value="all">
                  <ProductTable products={data.allProducts} title="All Products" icon={<BarChart className="w-5 h-5" />} />
                </TabsContent>
                <TabsContent value="chart">
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
                          Product Availability Chart
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-0 overflow-scroll'>
                        <Chart
                          chartType="BarChart"
                          width="1400px"
                          height="1500px"
                          data={chartData}
                          options={chartOptions}
                          className='mt-[-200px]'
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
                <TabsContent value="sale">
                  <ProductTable products={data.productsOnSale} title="Products on Sale" icon={<Tag className="w-5 h-5" />} />
                </TabsContent>
                <TabsContent value="rebate">
                  <ProductTable products={data.productsWithRebate} title="Products with Manufacturer Rebates" icon={<Gift className="w-5 h-5" />} />
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function ProductTable({ products, title, icon }: { products: Product[]; title: string; icon: React.ReactNode }) {
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortOrder }>({ key: 'ProductModelName', direction: 'asc' })
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const sortedData = [...products]
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    setSortedProducts(sortedData)
  }, [products, sortConfig])

  const requestSort = (key: SortKey) => {
    let direction: SortOrder = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const filteredProducts = sortedProducts.filter(product =>
    product.ProductModelName.toLowerCase().includes(filter.toLowerCase())
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
            {icon}
            {title}
          </CardTitle>
          <div className="relative top-4">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                <TableHead onClick={() => requestSort('ProductModelName')} className="cursor-pointer">
                  Product Name {sortConfig.key === 'ProductModelName' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16}  className="inline" />)}
                </TableHead>
                <TableHead onClick={() => requestSort('ProductPrice')} className="cursor-pointer">
                  Price {sortConfig.key === 'ProductPrice' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
                </TableHead>
                <TableHead onClick={() => requestSort('Inventory')} className="cursor-pointer">
                  Available Items {sortConfig.key === 'Inventory' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />)}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, index) => (
                <motion.tr
                  key={product.ProductModelName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.1, delay: index * 0.01 }}
                >
                  <TableCell className="font-medium">{product.ProductModelName}</TableCell>
                  <TableCell>${product.ProductPrice.toFixed(2)}</TableCell>
                  <TableCell>{product.Inventory}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}