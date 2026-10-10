import { useEffect, useState } from 'react'
import { getProducts, type Product } from './api.ts'

/** Each mounted consumer owns its request; cleanup aborts IO and discards late results. */
export function useProducts() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)
    const [version, setVersion] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        setProducts([])
        setLoading(true)
        setFailed(false)
        void getProducts(controller.signal).then((items) => {
            if (!controller.signal.aborted) setProducts(items)
        }).catch(() => {
            if (!controller.signal.aborted) setFailed(true)
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false)
        })
        return () => controller.abort()
    }, [version])

    return { products, loading, failed, retry: () => setVersion((value) => value + 1) }
}
