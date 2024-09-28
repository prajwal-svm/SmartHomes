import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Product from './Product'
import { Heart, MapPin, Trophy, Package, TrendingUp, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface TrendingData {
    topLikedProducts: Product[]
    topZipCodes: {
        ZipCode: string
        ProductsSold: number
        StoreID: number
        StoreName: string
        Street: string
        City: string
        State: string
    }[]
    topSoldProducts: Product[]
}

interface Product {
    ProductID: string
    ProductModelName: string
    ProductCategory: string
    ProductPrice: number
    ProductImage: string
    RatingAvg: number
    OnSale: boolean
    ManufacturerName: string
    ManufacturerRebate: boolean
}

export default function Trending() {
    const [trendingData, setTrendingData] = useState<TrendingData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTrendingData = useCallback(async () => {
        try {
            const [trendingResponse, storesResponse] = await Promise.all([
                fetch('http://localhost:8080/SmartHomes/trending'),
                fetch('http://localhost:8080/SmartHomes/api/stores')
            ])

            if (!trendingResponse.ok || !storesResponse.ok) {
                throw new Error('Failed to fetch data')
            }

            const [trendingData, storesData] = await Promise.all([
                trendingResponse.json(),
                storesResponse.json()
            ])

            const zipcodeStoreMap = storesData.reduce((acc, store) => {
                acc[store.ZipCode] = {
                    StoreID: store.StoreID,
                    StoreName: store.StoreName,
                    Street: store.Street,
                    City: store.City,
                    State: store.State,
                    ZipCode: store.ZipCode
                }
                return acc
            }, {})

            trendingData.topZipCodes = trendingData.topZipCodes.map((zipCode) => {
                const storeInfo = zipcodeStoreMap[zipCode.ZipCode]
                if (storeInfo) {
                    return { ...zipCode, ...storeInfo }
                }
                console.warn(`No store information found for zip code: ${zipCode.ZipCode}`)
                return zipCode
            })

            setTrendingData(trendingData)
        } catch (err) {
            setError('An error occurred while fetching data')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTrendingData()
    }, [fetchTrendingData])

    const productVariants = useMemo(() => ({
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 }
    }), [])

    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Loading trending data...</div>
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>
    }

    return (
        <Card className="w-full mx-auto">
            <CardHeader>
                <Link to="/" className="flex items-center gap-2 text-blue-600 hover:underline mb-4">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Home
                </Link>
                <CardTitle className="text-2xl font-bold flex items-center gap-2 mx-auto">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    Trending
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="liked" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="liked" className="flex items-center justify-center">
                            <Heart className="w-5 h-5 mr-2 text-red-500" />
                            Most Liked
                        </TabsTrigger>
                        <TabsTrigger value="zipcodes" className="flex items-center justify-center">
                            <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                            Top Zip Codes
                        </TabsTrigger>
                        <TabsTrigger value="sold" className="flex items-center justify-center">
                            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                            Best Sellers
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="liked">
                        <ProductList products={trendingData?.topLikedProducts.slice(0, 5)} variants={productVariants} />
                    </TabsContent>
                    <TabsContent value="zipcodes">
                        <ZipCodeList zipCodes={trendingData?.topZipCodes.slice(0, 5)} />
                    </TabsContent>
                    <TabsContent value="sold">
                        <ProductList products={trendingData?.topSoldProducts.slice(0, 5)} variants={productVariants} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

const ProductList = React.memo(({ products, variants }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product, index) => (
            <motion.div
                key={product.ProductID}
                variants={variants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: index * 0.1 }}
            >
                <Product
                    {...product}
                    setCart={() => { }}
                    quantity={0}
                    products={[]}
                />
            </motion.div>
        ))}
    </div>
))

const ZipCodeList = React.memo(({ zipCodes }) => (
    <ul className="space-y-2">
        {zipCodes?.map((zipCode, index) => (
            <motion.li
                key={zipCode.ZipCode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-blue-600">{zipCode.ZipCode}</span>
                            <span className="text-sm text-gray-500">|</span>
                            <span className="text-sm text-gray-600">{zipCode.City}, {zipCode.State}</span>
                            <span className="text-sm text-gray-500">|</span>
                            <span className="text-sm text-gray-600">{zipCode.StoreName}</span>
                        </div>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                                    <Package className="w-4 h-4" />
                                    <span className="font-semibold">{zipCode.ProductsSold}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-sm">Products sold in this area</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </motion.li>
        ))}
    </ul>
))