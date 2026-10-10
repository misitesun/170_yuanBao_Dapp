import { request } from '@/services/http/index.ts'
import { decimal, integer, list, object, string } from '../api-fields.ts'

export interface Product {
    id: number
    name: string
    image: string
    price: string
    purchUsdt: string
    purchBao: string
    giftEnergy: string
    stock: number
}

export function parseProducts(value: unknown): Product[] {
    return list(object(value).products).map((value) => {
        const row = object(value)
        return {
            id: integer(row.id, 1), name: string(row.name), image: string(row.image),
            price: decimal(row.price), purchUsdt: decimal(row.purch_usdt),
            purchBao: decimal(row.purch_bao), giftEnergy: decimal(row.gift_energy),
            stock: integer(row.stock, Number.MIN_SAFE_INTEGER),
        }
    })
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
    return parseProducts(await request<unknown>({ url: '/api/products', authentication: 'none', signal }))
}
