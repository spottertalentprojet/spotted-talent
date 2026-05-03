export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          adresse: string | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          competences: string | null
          contrat: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          localisation: string | null
          nom: string | null
          notification_offres_email: boolean
          permis: string | null
          poste: string | null
          prenom: string | null
          role: Database["public"]["Enums"]["user_role"]
          secteur: string | null
          telephone: string | null
          telephone2: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adresse?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          competences?: string | null
          contrat?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          localisation?: string | null
          nom?: string | null
          notification_offres_email?: boolean
          permis?: string | null
          poste?: string | null
          prenom?: string | null
          role: Database["public"]["Enums"]["user_role"]
          secteur?: string | null
          telephone?: string | null
          telephone2?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adresse?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          competences?: string | null
          contrat?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          localisation?: string | null
          nom?: string | null
          notification_offres_email?: boolean
          permis?: string | null
          poste?: string | null
          prenom?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          secteur?: string | null
          telephone?: string | null
          telephone2?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offres: {
        Row: {
          avantages: string | null
          competences: string | null
          contrat: string | null
          created_at: string
          description: string | null
          diplome: string | null
          entreprise_id: string
          id: string
          localisation: string | null
          permis_requis: string | null
          salaire_max: number | null
          salaire_min: number | null
          secteur: string | null
          statut: string | null
          titre: string
          urgent: boolean | null
        }
        Insert: {
          avantages?: string | null
          competences?: string | null
          contrat?: string | null
          created_at?: string
          description?: string | null
          diplome?: string | null
          entreprise_id: string
          id?: string
          localisation?: string | null
          permis_requis?: string | null
          salaire_max?: number | null
          salaire_min?: number | null
          secteur?: string | null
          statut?: string | null
          titre: string
          urgent?: boolean | null
        }
        Update: {
          avantages?: string | null
          competences?: string | null
          contrat?: string | null
          created_at?: string
          description?: string | null
          diplome?: string | null
          entreprise_id?: string
          id?: string
          localisation?: string | null
          permis_requis?: string | null
          salaire_max?: number | null
          salaire_min?: number | null
          secteur?: string | null
          statut?: string | null
          titre?: string
          urgent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "offres_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      candidatures: {
        Row: {
          created_at: string
          id: string
          note: number | null
          offre_id: string
          statut: string | null
          talent_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: number | null
          offre_id: string
          statut?: string | null
          talent_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: number | null
          offre_id?: string
          statut?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidatures_offre_id_fkey"
            columns: ["offre_id"]
            isOneToOne: false
            referencedRelation: "offres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidatures_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      document_requests: {
        Row: {
          candidature_id: string
          created_at: string
          document_key: string
          document_label: string
          entreprise_id: string
          file_name: string | null
          id: string
          requested_at: string
          requested_by: string
          status: string
          storage_path: string | null
          talent_id: string
          uploaded_at: string | null
        }
        Insert: {
          candidature_id: string
          created_at?: string
          document_key: string
          document_label: string
          entreprise_id: string
          file_name?: string | null
          id?: string
          requested_at?: string
          requested_by: string
          status?: string
          storage_path?: string | null
          talent_id: string
          uploaded_at?: string | null
        }
        Update: {
          candidature_id?: string
          created_at?: string
          document_key?: string
          document_label?: string
          entreprise_id?: string
          file_name?: string | null
          id?: string
          requested_at?: string
          requested_by?: string
          status?: string
          storage_path?: string | null
          talent_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_candidature_id_fkey"
            columns: ["candidature_id"]
            isOneToOne: false
            referencedRelation: "candidatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      billing_accounts: {
        Row: {
          addon_ids: string[]
          address_line1: string | null
          address_line2: string | null
          billing_cycle: string
          billing_email: string | null
          city: string | null
          country: string
          created_at: string
          current_period_end: string | null
          legal_name: string | null
          plan_id: string
          postal_code: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_ends_at: string
          trial_plan_locked: string | null
          trial_started_at: string
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          addon_ids?: string[]
          address_line1?: string | null
          address_line2?: string | null
          billing_cycle?: string
          billing_email?: string | null
          city?: string | null
          country?: string
          created_at?: string
          current_period_end?: string | null
          legal_name?: string | null
          plan_id?: string
          postal_code?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string
          trial_plan_locked?: string | null
          trial_started_at?: string
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          addon_ids?: string[]
          address_line1?: string | null
          address_line2?: string | null
          billing_cycle?: string
          billing_email?: string | null
          city?: string | null
          country?: string
          created_at?: string
          current_period_end?: string | null
          legal_name?: string | null
          plan_id?: string
          postal_code?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string
          trial_plan_locked?: string | null
          trial_started_at?: string
          updated_at?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      billing_checkout_events: {
        Row: {
          addon_ids: string[]
          amount_ttc_cents: number | null
          billing_cycle: string
          created_at: string
          id: string
          plan_id: string
          status: string
          stripe_checkout_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          addon_ids?: string[]
          amount_ttc_cents?: number | null
          billing_cycle?: string
          created_at?: string
          id?: string
          plan_id: string
          status?: string
          stripe_checkout_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          addon_ids?: string[]
          amount_ttc_cents?: number | null
          billing_cycle?: string
          created_at?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_checkout_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount_ht_cents: number
          amount_ttc_cents: number
          created_at: string
          currency: string
          id: string
          invoice_number: string
          issued_at: string
          metadata: Json
          paid_at: string | null
          pdf_url: string | null
          period_label: string | null
          status: string
          stripe_invoice_id: string | null
          user_id: string
          vat_rate: number
        }
        Insert: {
          amount_ht_cents?: number
          amount_ttc_cents?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number: string
          issued_at?: string
          metadata?: Json
          paid_at?: string | null
          pdf_url?: string | null
          period_label?: string | null
          status?: string
          stripe_invoice_id?: string | null
          user_id: string
          vat_rate?: number
        }
        Update: {
          amount_ht_cents?: number
          amount_ttc_cents?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          metadata?: Json
          paid_at?: string | null
          pdf_url?: string | null
          period_label?: string | null
          status?: string
          stripe_invoice_id?: string | null
          user_id?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          candidature_id: string
          contenu: string
          created_at: string
          destinataire_id: string
          expedition_id: string
          id: string
          lu: boolean
        }
        Insert: {
          candidature_id: string
          contenu: string
          created_at?: string
          destinataire_id: string
          expedition_id: string
          id?: string
          lu?: boolean
        }
        Update: {
          candidature_id?: string
          contenu?: string
          created_at?: string
          destinataire_id?: string
          expedition_id?: string
          id?: string
          lu?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_candidature_id_fkey"
            columns: ["candidature_id"]
            isOneToOne: false
            referencedRelation: "candidatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_destinataire_id_fkey"
            columns: ["destinataire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_expedition_id_fkey"
            columns: ["expedition_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_matching_talent_email_recipients_for_offer: {
        Args: {
          p_offre_id: string
        }
        Returns: {
          email: string
          full_name: string
          user_id: string
        }[]
      }
    }
    Enums: {
      user_role: "talent" | "entreprise"
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
      user_role: ["talent", "entreprise"],
    },
  },
} as const
