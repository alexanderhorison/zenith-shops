
import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../.env.local')

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
} else {
    console.error('❌ .env.local not found at:', envPath)
    process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function seedCustomers() {
    console.log('🌱 Starting standalone customer seed (No Auth)...')

    // Fetch some products to create orders with
    const { data: products } = await supabase.from('products').select('id, price')
    if (!products || products.length === 0) {
        console.warn('⚠️ No products found. Seeding customers without orders.')
    }

    const NUM_CUSTOMERS = 50
    let createdCount = 0

    for (let i = 0; i < NUM_CUSTOMERS; i++) {
        const email = faker.internet.email()
        const fullName = faker.person.fullName()
        const dob = faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0]

        // 1. Insert directly into Customers Table (ID is auto-generated)
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .insert({
                email,
                full_name: fullName,
                dob,
                is_active: faker.datatype.boolean({ probability: 0.9 })
            })
            .select('id')
            .single()

        if (customerError) {
            console.error(`❌ Failed to create customer ${email}:`, customerError.message)
            continue
        }

        const userId = customer.id

        // 2. Create Random Orders for this customer (if products exist)
        if (products && products.length > 0) {
            const numOrders = faker.number.int({ min: 0, max: 5 })

            for (let j = 0; j < numOrders; j++) {
                const numItems = faker.number.int({ min: 1, max: 4 })
                let totalAmount = 0
                const orderItems = []

                for (let k = 0; k < numItems; k++) {
                    const product = faker.helpers.arrayElement(products)
                    const quantity = faker.number.int({ min: 1, max: 3 })
                    const itemTotal = Number(product.price) * quantity
                    totalAmount += itemTotal

                    orderItems.push({
                        product_id: product.id,
                        quantity,
                        unit_price: product.price
                    })
                }

                // Insert Order
                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        user_id: userId,
                        total_amount: totalAmount,
                        status: faker.helpers.arrayElement(['completed', 'pending', 'cancelled', 'completed', 'completed']),
                        created_at: faker.date.past()
                    })
                    .select()
                    .single()

                if (orderError) {
                    console.error(`  ❌ Failed to create order:`, orderError.message)
                    continue
                }

                // Insert Order Items
                const itemsToInsert = orderItems.map(item => ({
                    ...item,
                    order_id: order.id
                }))

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(itemsToInsert)

                if (itemsError) {
                    console.error(`  ❌ Failed to create order items:`, itemsError.message)
                }
            }
        }

        createdCount++
        if (createdCount % 10 === 0) {
            console.log(`✅ Created ${createdCount} customers...`)
        }
    }

    console.log(`✨ DONE! Successfully seeded ${createdCount} standalone customers.`)
}

seedCustomers()
