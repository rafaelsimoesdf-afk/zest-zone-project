export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean
          latitude: number | null
          longitude: number | null
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string
          number?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_holder_name: string
          account_number: string
          account_type: string
          agency: string
          bank_name: string
          cpf_cnpj: string
          created_at: string
          id: string
          is_default: boolean
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          account_holder_name: string
          account_number: string
          account_type: string
          agency: string
          bank_name: string
          cpf_cnpj: string
          created_at?: string
          id?: string
          is_default?: boolean
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          account_type?: string
          agency?: string
          bank_name?: string
          cpf_cnpj?: string
          created_at?: string
          id?: string
          is_default?: boolean
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_acceptances: {
        Row: {
          basic_rules_accepted: boolean
          basic_rules_accepted_at: string | null
          booking_id: string
          cancellation_policy_accepted: boolean
          cancellation_policy_accepted_at: string | null
          created_at: string
          id: string
          ip_address: string | null
          owner_rules_accepted: boolean
          owner_rules_accepted_at: string | null
          privacy_policy_accepted: boolean
          privacy_policy_accepted_at: string | null
          terms_of_service_accepted: boolean
          terms_of_service_accepted_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          basic_rules_accepted?: boolean
          basic_rules_accepted_at?: string | null
          booking_id: string
          cancellation_policy_accepted?: boolean
          cancellation_policy_accepted_at?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          owner_rules_accepted?: boolean
          owner_rules_accepted_at?: string | null
          privacy_policy_accepted?: boolean
          privacy_policy_accepted_at?: string | null
          terms_of_service_accepted?: boolean
          terms_of_service_accepted_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          basic_rules_accepted?: boolean
          basic_rules_accepted_at?: string | null
          booking_id?: string
          cancellation_policy_accepted?: boolean
          cancellation_policy_accepted_at?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          owner_rules_accepted?: boolean
          owner_rules_accepted_at?: string | null
          privacy_policy_accepted?: boolean
          privacy_policy_accepted_at?: string | null
          terms_of_service_accepted?: boolean
          terms_of_service_accepted_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_acceptances_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancelled_reason: string | null
          created_at: string
          customer_id: string
          daily_rate: number
          end_date: string
          end_time: string | null
          extra_hours: number | null
          extra_hours_charge: number | null
          id: string
          notes: string | null
          owner_id: string
          pickup_location: string | null
          return_location: string | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_days: number
          total_price: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cancelled_reason?: string | null
          created_at?: string
          customer_id: string
          daily_rate: number
          end_date: string
          end_time?: string | null
          extra_hours?: number | null
          extra_hours_charge?: number | null
          id?: string
          notes?: string | null
          owner_id: string
          pickup_location?: string | null
          return_location?: string | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_days: number
          total_price: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cancelled_reason?: string | null
          created_at?: string
          customer_id?: string
          daily_rate?: number
          end_date?: string
          end_time?: string | null
          extra_hours?: number | null
          extra_hours_charge?: number | null
          id?: string
          notes?: string | null
          owner_id?: string
          pickup_location?: string | null
          return_location?: string | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_days?: number
          total_price?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cnh_details: {
        Row: {
          back_image_url: string
          category: Database["public"]["Enums"]["cnh_category"]
          cnh_number: string
          created_at: string
          digital_image_url: string | null
          expiry_date: string
          front_image_url: string
          id: string
          is_valid: boolean | null
          issue_date: string
          updated_at: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          back_image_url: string
          category: Database["public"]["Enums"]["cnh_category"]
          cnh_number: string
          created_at?: string
          digital_image_url?: string | null
          expiry_date: string
          front_image_url: string
          id?: string
          is_valid?: boolean | null
          issue_date: string
          updated_at?: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          back_image_url?: string
          category?: Database["public"]["Enums"]["cnh_category"]
          cnh_number?: string
          created_at?: string
          digital_image_url?: string | null
          expiry_date?: string
          front_image_url?: string
          id?: string
          is_valid?: boolean | null
          issue_date?: string
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_documents: {
        Row: {
          back_image_url: string
          created_at: string
          document_type: string
          front_image_url: string
          id: string
          updated_at: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          back_image_url: string
          created_at?: string
          document_type: string
          front_image_url: string
          id?: string
          updated_at?: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          back_image_url?: string
          created_at?: string
          document_type?: string
          front_image_url?: string
          id?: string
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      listing_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
          listing_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
          listing_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vehicle_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          listing_id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          listing_id: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          listing_id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "vehicle_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read: boolean
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read?: boolean
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read?: boolean
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          refund_amount: number | null
          refunded_at: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          refund_amount?: number | null
          refunded_at?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          refund_amount?: number | null
          refunded_at?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          data_accuracy_declared: boolean | null
          email: string
          email_verified_at: string | null
          first_name: string
          id: string
          is_email_verified: boolean
          is_phone_verified: boolean
          last_login_at: string | null
          last_name: string
          lgpd_accepted: boolean | null
          phone_number: string | null
          phone_verified_at: string | null
          profile_image: string | null
          status: Database["public"]["Enums"]["user_status"]
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          terms_accepted: boolean | null
          updated_at: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verification_submitted_at: string | null
          verification_validated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          data_accuracy_declared?: boolean | null
          email: string
          email_verified_at?: string | null
          first_name: string
          id: string
          is_email_verified?: boolean
          is_phone_verified?: boolean
          last_login_at?: string | null
          last_name: string
          lgpd_accepted?: boolean | null
          phone_number?: string | null
          phone_verified_at?: string | null
          profile_image?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          terms_accepted?: boolean | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verification_submitted_at?: string | null
          verification_validated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          data_accuracy_declared?: boolean | null
          email?: string
          email_verified_at?: string | null
          first_name?: string
          id?: string
          is_email_verified?: boolean
          is_phone_verified?: boolean
          last_login_at?: string | null
          last_name?: string
          lgpd_accepted?: boolean | null
          phone_number?: string | null
          phone_verified_at?: string | null
          profile_image?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          terms_accepted?: boolean | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verification_submitted_at?: string | null
          verification_validated_at?: string | null
        }
        Relationships: []
      }
      proof_of_residence: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["proof_of_residence_type"]
          document_url: string
          id: string
          issue_date: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["proof_of_residence_type"]
          document_url: string
          id?: string
          issue_date?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["proof_of_residence_type"]
          document_url?: string
          id?: string
          issue_date?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      selfie_upload_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          selfie_url: string | null
          session_token: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          selfie_url?: string | null
          session_token: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          selfie_url?: string | null
          session_token?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      selfie_verifications: {
        Row: {
          created_at: string
          id: string
          selfie_url: string
          updated_at: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          selfie_url: string
          updated_at?: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          selfie_url?: string
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          created_at: string
          document_number: string
          document_type: string
          document_url: string
          expires_at: string | null
          id: string
          updated_at: string
          user_id: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          document_number: string
          document_type: string
          document_url: string
          expires_at?: string | null
          id?: string
          updated_at?: string
          user_id: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          document_number?: string
          document_type?: string
          document_url?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_brands: {
        Row: {
          country: string
          created_at: string
          id: string
          is_popular: boolean
          logo_url: string | null
          name: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          is_popular?: boolean
          logo_url?: string | null
          name: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          is_popular?: boolean
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      vehicle_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
          vehicle_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_inspection_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          inspection_id: string
          photo_url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          inspection_id: string
          photo_url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          inspection_id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspection_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_inspections: {
        Row: {
          booking_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          inspection_type: string
          inspector_id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          inspection_type: string
          inspector_id: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          inspection_type?: string
          inspector_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_inspections_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_listings: {
        Row: {
          accepts_trade: boolean
          allow_chat: boolean
          brand: string
          city: string | null
          color: string
          condition: string
          created_at: string
          description: string | null
          doors: number
          fuel_type: string
          has_air_conditioning: boolean
          id: string
          license_plate: string | null
          mileage: number
          model: string
          sale_price: number
          seats: number
          seller_id: string
          show_phone: boolean
          state: string | null
          status: Database["public"]["Enums"]["listing_status"]
          transmission_type: string
          updated_at: string
          vehicle_id: string | null
          vehicle_type: string
          views_count: number
          whatsapp_number: string | null
          year: number
        }
        Insert: {
          accepts_trade?: boolean
          allow_chat?: boolean
          brand: string
          city?: string | null
          color: string
          condition?: string
          created_at?: string
          description?: string | null
          doors?: number
          fuel_type: string
          has_air_conditioning?: boolean
          id?: string
          license_plate?: string | null
          mileage: number
          model: string
          sale_price: number
          seats?: number
          seller_id: string
          show_phone?: boolean
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          transmission_type: string
          updated_at?: string
          vehicle_id?: string | null
          vehicle_type: string
          views_count?: number
          whatsapp_number?: string | null
          year: number
        }
        Update: {
          accepts_trade?: boolean
          allow_chat?: boolean
          brand?: string
          city?: string | null
          color?: string
          condition?: string
          created_at?: string
          description?: string | null
          doors?: number
          fuel_type?: string
          has_air_conditioning?: boolean
          id?: string
          license_plate?: string | null
          mileage?: number
          model?: string
          sale_price?: number
          seats?: number
          seller_id?: string
          show_phone?: boolean
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          transmission_type?: string
          updated_at?: string
          vehicle_id?: string | null
          vehicle_type?: string
          views_count?: number
          whatsapp_number?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_listings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_models: {
        Row: {
          brand_id: string
          category: string | null
          created_at: string
          id: string
          is_popular: boolean
          name: string
        }
        Insert: {
          brand_id: string
          category?: string | null
          created_at?: string
          id?: string
          is_popular?: boolean
          name: string
        }
        Update: {
          brand_id?: string
          category?: string | null
          created_at?: string
          id?: string
          is_popular?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "vehicle_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          address_id: string | null
          airbag_frontal: boolean | null
          airbag_lateral: boolean | null
          alarme: boolean | null
          android_auto: boolean | null
          ano_fabricacao: number | null
          ano_modelo: number | null
          app_driver_monthly_price: number | null
          app_driver_rental: boolean | null
          app_driver_weekly_price: number | null
          apple_carplay: boolean | null
          ar_digital: boolean | null
          banco_couro: boolean | null
          banco_eletrico: boolean | null
          bluetooth: boolean | null
          brand: string
          brand_id: string | null
          camera_re: boolean | null
          carregador_inducao: boolean | null
          caucao: number | null
          chassi_mascarado: string | null
          chave_reserva: boolean | null
          city: string | null
          color: string
          controle_estabilidade: boolean | null
          controle_tracao: boolean | null
          created_at: string
          daily_price: number
          description: string | null
          direcao: string | null
          direcao_eletrica: boolean | null
          direcao_hidraulica: boolean | null
          document_url: string | null
          document_verified: boolean | null
          document_verified_at: string | null
          doors: number
          engate: boolean | null
          entrada_usb: boolean | null
          farol_led: boolean | null
          farol_milha: boolean | null
          freios_abs: boolean | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          gps: boolean | null
          has_air_conditioning: boolean
          id: string
          license_plate: string
          manual_veiculo: boolean | null
          mileage: number
          model: string
          model_id: string | null
          motor: string | null
          multimidia: boolean | null
          owner_id: string
          piloto_automatico: boolean | null
          rack_teto: boolean | null
          regras: string | null
          retrovisores_eletricos: boolean | null
          rodas_liga_leve: boolean | null
          seats: number
          sensor_chuva: boolean | null
          sensor_crepuscular: boolean | null
          sensor_estacionamento: boolean | null
          situacao_veiculo: string | null
          start_stop: boolean | null
          state: string | null
          status: Database["public"]["Enums"]["vehicle_status"]
          transmission_type: Database["public"]["Enums"]["transmission_type"]
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          versao: string | null
          vidros_eletricos: boolean | null
          wifi: boolean | null
          year: number
        }
        Insert: {
          address_id?: string | null
          airbag_frontal?: boolean | null
          airbag_lateral?: boolean | null
          alarme?: boolean | null
          android_auto?: boolean | null
          ano_fabricacao?: number | null
          ano_modelo?: number | null
          app_driver_monthly_price?: number | null
          app_driver_rental?: boolean | null
          app_driver_weekly_price?: number | null
          apple_carplay?: boolean | null
          ar_digital?: boolean | null
          banco_couro?: boolean | null
          banco_eletrico?: boolean | null
          bluetooth?: boolean | null
          brand: string
          brand_id?: string | null
          camera_re?: boolean | null
          carregador_inducao?: boolean | null
          caucao?: number | null
          chassi_mascarado?: string | null
          chave_reserva?: boolean | null
          city?: string | null
          color: string
          controle_estabilidade?: boolean | null
          controle_tracao?: boolean | null
          created_at?: string
          daily_price: number
          description?: string | null
          direcao?: string | null
          direcao_eletrica?: boolean | null
          direcao_hidraulica?: boolean | null
          document_url?: string | null
          document_verified?: boolean | null
          document_verified_at?: string | null
          doors: number
          engate?: boolean | null
          entrada_usb?: boolean | null
          farol_led?: boolean | null
          farol_milha?: boolean | null
          freios_abs?: boolean | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          gps?: boolean | null
          has_air_conditioning?: boolean
          id?: string
          license_plate: string
          manual_veiculo?: boolean | null
          mileage: number
          model: string
          model_id?: string | null
          motor?: string | null
          multimidia?: boolean | null
          owner_id: string
          piloto_automatico?: boolean | null
          rack_teto?: boolean | null
          regras?: string | null
          retrovisores_eletricos?: boolean | null
          rodas_liga_leve?: boolean | null
          seats: number
          sensor_chuva?: boolean | null
          sensor_crepuscular?: boolean | null
          sensor_estacionamento?: boolean | null
          situacao_veiculo?: string | null
          start_stop?: boolean | null
          state?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          transmission_type: Database["public"]["Enums"]["transmission_type"]
          updated_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          versao?: string | null
          vidros_eletricos?: boolean | null
          wifi?: boolean | null
          year: number
        }
        Update: {
          address_id?: string | null
          airbag_frontal?: boolean | null
          airbag_lateral?: boolean | null
          alarme?: boolean | null
          android_auto?: boolean | null
          ano_fabricacao?: number | null
          ano_modelo?: number | null
          app_driver_monthly_price?: number | null
          app_driver_rental?: boolean | null
          app_driver_weekly_price?: number | null
          apple_carplay?: boolean | null
          ar_digital?: boolean | null
          banco_couro?: boolean | null
          banco_eletrico?: boolean | null
          bluetooth?: boolean | null
          brand?: string
          brand_id?: string | null
          camera_re?: boolean | null
          carregador_inducao?: boolean | null
          caucao?: number | null
          chassi_mascarado?: string | null
          chave_reserva?: boolean | null
          city?: string | null
          color?: string
          controle_estabilidade?: boolean | null
          controle_tracao?: boolean | null
          created_at?: string
          daily_price?: number
          description?: string | null
          direcao?: string | null
          direcao_eletrica?: boolean | null
          direcao_hidraulica?: boolean | null
          document_url?: string | null
          document_verified?: boolean | null
          document_verified_at?: string | null
          doors?: number
          engate?: boolean | null
          entrada_usb?: boolean | null
          farol_led?: boolean | null
          farol_milha?: boolean | null
          freios_abs?: boolean | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          gps?: boolean | null
          has_air_conditioning?: boolean
          id?: string
          license_plate?: string
          manual_veiculo?: boolean | null
          mileage?: number
          model?: string
          model_id?: string | null
          motor?: string | null
          multimidia?: boolean | null
          owner_id?: string
          piloto_automatico?: boolean | null
          rack_teto?: boolean | null
          regras?: string | null
          retrovisores_eletricos?: boolean | null
          rodas_liga_leve?: boolean | null
          seats?: number
          sensor_chuva?: boolean | null
          sensor_crepuscular?: boolean | null
          sensor_estacionamento?: boolean | null
          situacao_veiculo?: string | null
          start_stop?: boolean | null
          state?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          transmission_type?: Database["public"]["Enums"]["transmission_type"]
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          versao?: string | null
          vidros_eletricos?: boolean | null
          wifi?: boolean | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "vehicle_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "vehicle_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_config: {
        Row: {
          auto_approval_limit: number
          id: string
          minimum_withdrawal: number
          platform_fee_percentage: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_approval_limit?: number
          id?: string
          minimum_withdrawal?: number
          platform_fee_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_approval_limit?: number
          id?: string
          minimum_withdrawal?: number
          platform_fee_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      withdrawal_settings: {
        Row: {
          auto_withdraw_enabled: boolean
          created_at: string
          frequency: Database["public"]["Enums"]["withdrawal_frequency"]
          id: string
          minimum_amount: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          auto_withdraw_enabled?: boolean
          created_at?: string
          frequency?: Database["public"]["Enums"]["withdrawal_frequency"]
          id?: string
          minimum_amount?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          auto_withdraw_enabled?: boolean
          created_at?: string
          frequency?: Database["public"]["Enums"]["withdrawal_frequency"]
          id?: string
          minimum_amount?: number
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          auto_approved: boolean
          completed_at: string | null
          created_at: string
          id: string
          net_amount: number
          owner_id: string
          pix_key: string
          platform_fee: number
          rejection_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          transfer_proof_url: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          auto_approved?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          net_amount: number
          owner_id: string
          pix_key: string
          platform_fee?: number
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          transfer_proof_url?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          auto_approved?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          net_amount?: number
          owner_id?: string
          pix_key?: string
          platform_fee?: number
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          transfer_proof_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_role_by_email: { Args: { _email: string }; Returns: undefined }
      create_booking_atomic: {
        Args: {
          p_customer_id: string
          p_daily_rate: number
          p_end_date: string
          p_end_time: string
          p_extra_hours?: number
          p_extra_hours_charge?: number
          p_notes?: string
          p_owner_id: string
          p_pickup_location?: string
          p_return_location?: string
          p_start_date: string
          p_start_time: string
          p_total_days: number
          p_total_price: number
          p_vehicle_id: string
        }
        Returns: string
      }
      get_booking_participant_profile: {
        Args: { _user_id: string }
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
          phone_number: string
          profile_image: string
        }[]
      }
      get_owner_balance: {
        Args: { _owner_id: string }
        Returns: {
          available_balance: number
          pending_withdrawals: number
          platform_fees: number
          total_earnings: number
          total_withdrawn: number
        }[]
      }
      get_public_vehicle_bookings: {
        Args: { _vehicle_id: string }
        Returns: {
          end_date: string
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "owner" | "admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
      cnh_category: "A" | "B" | "C" | "D" | "E" | "AB" | "AC" | "AD" | "AE"
      fuel_type:
        | "gasoline"
        | "ethanol"
        | "flex"
        | "diesel"
        | "electric"
        | "hybrid"
      listing_status: "active" | "sold" | "paused" | "expired"
      notification_type:
        | "booking"
        | "payment"
        | "reminder"
        | "promotion"
        | "system"
        | "support"
      payment_method: "credit_card" | "debit_card" | "pix" | "bank_transfer"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
      proof_of_residence_type:
        | "conta_luz"
        | "conta_agua"
        | "conta_gas"
        | "conta_internet"
        | "conta_telefone"
        | "fatura_cartao"
        | "extrato_bancario"
        | "outro"
      transmission_type: "manual" | "automatic" | "cvt"
      user_status: "pending" | "verified" | "suspended" | "banned"
      vehicle_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
        | "inactive"
      vehicle_type:
        | "sedan"
        | "hatchback"
        | "suv"
        | "pickup"
        | "van"
        | "convertible"
        | "coupe"
        | "wagon"
      verification_status: "pending" | "approved" | "rejected"
      withdrawal_frequency: "weekly" | "biweekly" | "monthly"
      withdrawal_status:
        | "pending"
        | "approved"
        | "processing"
        | "completed"
        | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "owner", "admin"],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      cnh_category: ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"],
      fuel_type: [
        "gasoline",
        "ethanol",
        "flex",
        "diesel",
        "electric",
        "hybrid",
      ],
      listing_status: ["active", "sold", "paused", "expired"],
      notification_type: [
        "booking",
        "payment",
        "reminder",
        "promotion",
        "system",
        "support",
      ],
      payment_method: ["credit_card", "debit_card", "pix", "bank_transfer"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      proof_of_residence_type: [
        "conta_luz",
        "conta_agua",
        "conta_gas",
        "conta_internet",
        "conta_telefone",
        "fatura_cartao",
        "extrato_bancario",
        "outro",
      ],
      transmission_type: ["manual", "automatic", "cvt"],
      user_status: ["pending", "verified", "suspended", "banned"],
      vehicle_status: [
        "pending",
        "approved",
        "rejected",
        "suspended",
        "inactive",
      ],
      vehicle_type: [
        "sedan",
        "hatchback",
        "suv",
        "pickup",
        "van",
        "convertible",
        "coupe",
        "wagon",
      ],
      verification_status: ["pending", "approved", "rejected"],
      withdrawal_frequency: ["weekly", "biweekly", "monthly"],
      withdrawal_status: [
        "pending",
        "approved",
        "processing",
        "completed",
        "rejected",
      ],
    },
  },
} as const
