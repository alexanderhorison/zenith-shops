#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🚀 Setting up super admin user...')
  console.log('⚠️  Note: Make sure you have run the database schema in your Supabase SQL Editor first!')
  console.log('   Schema file: database/setup.sql')
  
  try {
    console.log('👤 Creating super admin user...')
    
    const adminEmail = 'alexanderhorison@gmail.com'
    const adminPassword = '123123'
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Alexander Horison'
      }
    })
    
    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log('✅ User already exists, checking role...')
        
        // Get the existing user
        const { data: existingUsers, error: getUserError } = await supabase.auth.admin.listUsers()
        if (getUserError) {
          console.error('❌ Error getting users:', getUserError)
          return
        }
        
        const existingUser = existingUsers.users.find(u => u.email === adminEmail)
        if (!existingUser) {
          console.error('❌ Could not find existing user')
          return
        }
        
        console.log('👤 Found existing user:', existingUser.email)
        
        // Check if user profile exists and update role
        const { data: profileData, error: profileSelectError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', existingUser.id)
          .single()
          
        if (profileSelectError) {
          if (profileSelectError.code === 'PGRST116') {
            console.log('📝 Creating user profile...')
            // Create profile if it doesn't exist
            const { error: createProfileError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: existingUser.id,
                email: adminEmail,
                full_name: 'Alexander Horison',
                role: 'super_admin',
                role_id: 1
              })
              
            if (createProfileError) {
              console.error('❌ Error creating user profile:', createProfileError)
              return
            }
            console.log('✅ User profile created with super_admin role!')
          } else {
            console.error('❌ Error checking user profile:', profileSelectError)
            return
          }
        } else {
          // Update existing profile to super_admin
          if (profileData.role !== 'super_admin') {
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ 
                role: 'super_admin',
                role_id: 1,
                full_name: 'Alexander Horison'
              })
              .eq('user_id', existingUser.id)
              
            if (updateError) {
              console.error('❌ Error updating user role:', updateError)
              return
            }
            console.log('✅ User role updated to super_admin!')
          } else {
            console.log('✅ User already has super_admin role!')
          }
        }
      } else {
        console.error('❌ Error creating admin user:', authError)
        return
      }
    } else {
      console.log('✅ New admin user created:', authData.user.email)
    
      // Assign super admin role for new user
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          role: 'super_admin',
          role_id: 1,
          full_name: 'Alexander Horison'
        })
        .eq('user_id', authData.user.id)
      
      if (profileError) {
        console.error('❌ Error assigning admin role:', profileError)
        return
      }
      
      console.log('✅ Super admin role assigned!')
    }
    
    console.log('✅ Initial setup complete!')
    console.log('')
    console.log('🎉 Your Coffee Shops CMS is ready!')
    console.log('')
    console.log('Default Super Admin Credentials:')
    console.log(`Email: ${adminEmail}`)
    console.log(`Password: ${adminPassword}`)
    console.log('')
    console.log('⚠️  Remember to change the default password after first login!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupDatabase()