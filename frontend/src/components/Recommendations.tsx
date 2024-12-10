import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Search, Star, User, ShoppingCart, ArrowLeft } from 'lucide-react'
import Product from '@/components/Product' // Import the Product component
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link } from 'react-router-dom'

export default function RecommendationsPage() {
    const [reviewQuery, setReviewQuery] = useState('')
    const [productQuery, setProductQuery] = useState('')
    const [reviews, setReviews] = useState([])
    const [recommendedProducts, setRecommendedProducts] = useState([])
    const [cart, setCart] = useState<{ [key: string]: { quantity: number } }>(() => {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        return user?.cart || {};
    });
    const [isSearchingReviews, setIsSearchingReviews] = useState(false)
    const [isRecommendingProduct, setIsRecommendingProduct] = useState(false)

    const handleCartUpdate = (id: string | number, quantity: number) => {
        setCart(prevCart => {
            const total = (prevCart[id]?.quantity || 0) + quantity;
            const newCart = { ...prevCart };

            if (total < 1) {
                delete newCart[id];
            } else {
                newCart[id] = { quantity: total };
            }

            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            user.cart = newCart;
            sessionStorage.setItem('user', JSON.stringify(user));

            return newCart;
        });
    };

    const handleSearchReviews = async () => {
        setIsSearchingReviews(true)
        try {
            const response = await fetch('http://localhost:8080/SmartHomes/api/ai/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: reviewQuery }),
            })
            const data = await response.json()
            setReviews(data.results.map(review => ({
                ...review,
                reviewerName: Math.random().toString(36).substring(2, 15)
            })) || [])
        } catch (error) {
            console.error('Error searching reviews:', error)
        } finally {
            setIsSearchingReviews(false)
        }
    }

    const handleRecommendProduct = async () => {
        setIsRecommendingProduct(true)
        try {
            const response = await fetch('http://localhost:8080/SmartHomes/api/ai/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: productQuery }),
            })
            const data = await response.json()

            const productsResponse = await fetch('http://localhost:8080/SmartHomes/products')
            const products = await productsResponse.json()

            const productsMap = products.reduce((acc, product) => {
                acc[product.ProductID] = product
                return acc
            }, {})

            const recommendedProducts = data.results.map(result => ({
                ...productsMap[result.productId],
                ...result
            }))

            setRecommendedProducts(recommendedProducts)
        } catch (error) {
            console.error('Error recommending product:', error)
        } finally {
            setIsRecommendingProduct(false)
        }
    }

    return (
        <div className="container mx-auto p-4 min-h-screen bg-gradient-to-b from-background to-secondary/20">
            <motion.h1
                className="text-4xl font-bold mb-8 text-center text-black flex items-center justify-between"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <p className="text-2xl font-bold">Smart Recommendations <p className="text-xs text-muted-foreground">powered by semantic search</p></p>
                <div className="flex items-center gap-4 relative ml-auto">
                <Button
                    onClick={() => window.history.back()}
                    variant="ghost"
                    className="border-yellow-300 ml-auto"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
                    <Link to="/cart" className="rounded-full relative p-2 bg-secondary">
                        <ShoppingCart className="h-5 w-5" />
                        <Badge className="absolute -top-2 -right-1 px-[6px]" variant="destructive">
                            {Object.values(cart).reduce((acc, item) => acc + item.quantity, 0)}
                        </Badge>
                        <span className="sr-only">View cart</span>
                    </Link>
                </div>
            </motion.h1>

            <Tabs defaultValue="reviews" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="reviews">Search Reviews</TabsTrigger>
                    <TabsTrigger value="recommend">Recommend Product</TabsTrigger>
                </TabsList>

                <TabsContent value="reviews">
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Reviews</CardTitle>
                            <CardDescription>Find reviews similar to your query</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-4">
                                <Input
                                    type="text"
                                    placeholder="Enter your review search query"
                                    value={reviewQuery}
                                    onChange={(e) => setReviewQuery(e.target.value)}
                                    className="flex-grow"
                                />
                                <Button onClick={handleSearchReviews} disabled={isSearchingReviews} className="bg-black text-white hover:bg-gray-800">
                                    {isSearchingReviews ? 'Searching...' : 'Search Reviews'}
                                    <Search className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                            <ScrollArea className="h-auto">
                                <AnimatePresence>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                        {reviews.map((review, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                            >
                                                <Card className="mb-4 overflow-hidden text-left">
                                                    <CardHeader className="bg-secondary/10">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-lg">{review.productModelName}</CardTitle>
                                                            <Badge className="ml-2  bg-lime-200 text-black">
                                                                Score: {((review.similarity_score - 1) * 100).toFixed(0)}%
                                                            </Badge>
                                                        </div>
                                                        <CardDescription className="flex items-center mt-2">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`h-4 w-4 ${i < review.reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                                            ))}
                                                            <span className="ml-2">{review.reviewRating}/5</span>
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="pt-4">
                                                        <div className="flex items-center mb-2">
                                                            <Avatar className="h-8 w-8 mr-2">
                                                                <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${review.reviewerName}`} />
                                                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="text-sm font-medium">{review.reviewerName}</p>
                                                                <p className="text-xs text-muted-foreground">Posted on: {new Date(review.reviewDate).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <p className="mt-2 text-sm">{review.reviewText}</p>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </AnimatePresence>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="recommend">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recommend Product</CardTitle>
                            <CardDescription>Get product recommendations based on your description</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-4">
                                <Input
                                    type="text"
                                    placeholder="Describe the product you're looking for"
                                    value={productQuery}
                                    onChange={(e) => setProductQuery(e.target.value)}
                                    className="flex-grow"
                                />
                                <Button onClick={handleRecommendProduct} disabled={isRecommendingProduct} className="bg-black text-white hover:bg-gray-800">
                                    {isRecommendingProduct ? 'Recommending...' : 'Recommend Product'}
                                    <Sparkles className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                            <ScrollArea className="h-auto">
                                <AnimatePresence>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {recommendedProducts.map((product) => (
                                            <motion.div
                                                key={product.productId}
                                                variants={{
                                                    hidden: { opacity: 0, y: 20 },
                                                    visible: { opacity: 1, y: 0 }
                                                }}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="mb-4"
                                            >
                                                <Product
                                                    {...product}
                                                    setCart={handleCartUpdate}
                                                    products={recommendedProducts}
                                                    quantity={cart[product.ProductID]?.quantity || 0}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </AnimatePresence>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}