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
      legal_acknowledgements: {
        Row: {
          accepted_at: string
          created_at: string
          id: string
          privacy_notice_version: string
          source: string
          terms_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          id?: string
          privacy_notice_version: string
          source: string
          terms_version: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          id?: string
          privacy_notice_version?: string
          source?: string
          terms_version?: string
          user_id?: string
        }
        Relationships: []
      }
      account_retention_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_retention_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      account_retention_status: {
        Row: {
          anonymized_at: string | null
          created_at: string
          deletion_warning_sent_at: string | null
          last_seen_at: string
          reactivated_at: string | null
          reminder_23d_sent_at: string | null
          reminder_29d_sent_at: string | null
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anonymized_at?: string | null
          created_at?: string
          deletion_warning_sent_at?: string | null
          last_seen_at?: string
          reactivated_at?: string | null
          reminder_23d_sent_at?: string | null
          reminder_29d_sent_at?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anonymized_at?: string | null
          created_at?: string
          deletion_warning_sent_at?: string | null
          last_seen_at?: string
          reactivated_at?: string | null
          reminder_23d_sent_at?: string | null
          reminder_29d_sent_at?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_retention_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      offres: {
        Row: {
          avantages: string | null
          competences: string | null
          contrat: string | null
          created_at: string
          description: string | null
          diplome: string | null
          duree_contrat: string | null
          employer_certification_version: string | null
          employer_certified_at: string | null
          entreprise_id: string
          expires_at: string | null
          experience_requise: string | null
          id: string
          localisation: string | null
          compliance_version: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string
          motif_contrat_temporaire: string | null
          permis_requis: string | null
          priority_rank: number
          public_reference: string | null
          questions_preselection: Json
          remuneration_periode: string | null
          salaire_max: number | null
          salaire_min: number | null
          secteur: string | null
          statut: string | null
          titre: string
          updated_at: string
          urgent: boolean | null
        }
        Insert: {
          avantages?: string | null
          competences?: string | null
          contrat?: string | null
          created_at?: string
          description?: string | null
          diplome?: string | null
          duree_contrat?: string | null
          employer_certification_version?: string | null
          employer_certified_at?: string | null
          entreprise_id: string
          expires_at?: string | null
          experience_requise?: string | null
          id?: string
          localisation?: string | null
          compliance_version?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          motif_contrat_temporaire?: string | null
          permis_requis?: string | null
          priority_rank?: number
          public_reference?: string | null
          questions_preselection?: Json
          remuneration_periode?: string | null
          salaire_max?: number | null
          salaire_min?: number | null
          secteur?: string | null
          statut?: string | null
          titre: string
          updated_at?: string
          urgent?: boolean | null
        }
        Update: {
          avantages?: string | null
          competences?: string | null
          contrat?: string | null
          created_at?: string
          description?: string | null
          diplome?: string | null
          duree_contrat?: string | null
          employer_certification_version?: string | null
          employer_certified_at?: string | null
          entreprise_id?: string
          expires_at?: string | null
          experience_requise?: string | null
          id?: string
          localisation?: string | null
          compliance_version?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          motif_contrat_temporaire?: string | null
          permis_requis?: string | null
          priority_rank?: number
          public_reference?: string | null
          questions_preselection?: Json
          remuneration_periode?: string | null
          salaire_max?: number | null
          salaire_min?: number | null
          secteur?: string | null
          statut?: string | null
          titre?: string
          updated_at?: string
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
      offer_reports: {
        Row: {
          created_at: string
          decision: string | null
          decision_reason: string | null
          details: string | null
          id: string
          offer_id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision?: string | null
          decision_reason?: string | null
          details?: string | null
          id?: string
          offer_id: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision?: string | null
          decision_reason?: string | null
          details?: string | null
          id?: string
          offer_id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_reports_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offres"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_moderation_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          offer_id: string
          reason: string
          report_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          offer_id: string
          reason: string
          report_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          offer_id?: string
          reason?: string
          report_id?: string | null
        }
        Relationships: []
      }
      saved_offers: {
        Row: {
          created_at: string
          id: string
          offre_id: string
          talent_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offre_id: string
          talent_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offre_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_offers_offre_id_fkey"
            columns: ["offre_id"]
            isOneToOne: false
            referencedRelation: "offres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_offers_talent_id_fkey"
            columns: ["talent_id"]
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
          reponses_preselection: Json
          statut: string | null
          talent_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: number | null
          offre_id: string
          reponses_preselection?: Json
          statut?: string | null
          talent_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: number | null
          offre_id?: string
          reponses_preselection?: Json
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
          receipt_confirmed_at: string | null
          received_at: string | null
          retention_expires_at: string | null
          storage_deleted_at: string | null
          deletion_reason: string | null
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
          receipt_confirmed_at?: string | null
          received_at?: string | null
          retention_expires_at?: string | null
          storage_deleted_at?: string | null
          deletion_reason?: string | null
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
          receipt_confirmed_at?: string | null
          received_at?: string | null
          retention_expires_at?: string | null
          storage_deleted_at?: string | null
          deletion_reason?: string | null
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
      platform_security_state: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          auto_triggered: boolean
          documents_locked: boolean
          id: boolean
          incident_mode: boolean
          public_message: string
          reason: string | null
          sensitive_writes_locked: boolean
          severity: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          auto_triggered?: boolean
          documents_locked?: boolean
          id?: boolean
          incident_mode?: boolean
          public_message?: string
          reason?: string | null
          sensitive_writes_locked?: boolean
          severity?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          auto_triggered?: boolean
          documents_locked?: boolean
          id?: boolean
          incident_mode?: boolean
          public_message?: string
          reason?: string | null
          sensitive_writes_locked?: boolean
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          actor_id: string | null
          auto_lock_applied: boolean
          contained_at: string | null
          created_at: string
          created_by: string | null
          details: Json
          detected_at: string
          id: string
          incident_type: string
          resolved_at: string | null
          severity: string
          source: string
          status: string
          summary: string
        }
        Insert: {
          actor_id?: string | null
          auto_lock_applied?: boolean
          contained_at?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          detected_at?: string
          id?: string
          incident_type: string
          resolved_at?: string | null
          severity: string
          source: string
          status?: string
          summary: string
        }
        Update: {
          actor_id?: string | null
          auto_lock_applied?: boolean
          contained_at?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          detected_at?: string
          id?: string
          incident_type?: string
          resolved_at?: string | null
          severity?: string
          source?: string
          status?: string
          summary?: string
        }
        Relationships: []
      }
      document_encryption_keys: {
        Row: {
          algorithm: string
          category: string
          created_at: string
          created_by: string
          document_request_id: string | null
          deletion_reason: string | null
          encrypted_size_bytes: number | null
          expires_at: string | null
          first_downloaded_at: string | null
          iv_b64: string | null
          key_b64: string | null
          original_file_name: string
          original_mime_type: string | null
          original_size_bytes: number | null
          owner_id: string
          receipt_confirmed_at: string | null
          received_at: string | null
          recipient_id: string | null
          relation_id: string | null
          retention_flow: string
          sent_at: string
          storage_deleted_at: string | null
          storage_path: string
        }
        Insert: {
          algorithm?: string
          category: string
          created_at?: string
          created_by?: string
          document_request_id?: string | null
          deletion_reason?: string | null
          encrypted_size_bytes?: number | null
          expires_at?: string | null
          first_downloaded_at?: string | null
          iv_b64: string | null
          key_b64: string | null
          original_file_name: string
          original_mime_type?: string | null
          original_size_bytes?: number | null
          owner_id: string
          receipt_confirmed_at?: string | null
          received_at?: string | null
          recipient_id?: string | null
          relation_id?: string | null
          retention_flow?: string
          sent_at?: string
          storage_deleted_at?: string | null
          storage_path: string
        }
        Update: {
          algorithm?: string
          category?: string
          created_at?: string
          created_by?: string
          document_request_id?: string | null
          deletion_reason?: string | null
          encrypted_size_bytes?: number | null
          expires_at?: string | null
          first_downloaded_at?: string | null
          iv_b64?: string | null
          key_b64?: string | null
          original_file_name?: string
          original_mime_type?: string | null
          original_size_bytes?: number | null
          owner_id?: string
          receipt_confirmed_at?: string | null
          received_at?: string | null
          recipient_id?: string | null
          relation_id?: string | null
          retention_flow?: string
          sent_at?: string
          storage_deleted_at?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_encryption_keys_document_request_id_fkey"
            columns: ["document_request_id"]
            isOneToOne: false
            referencedRelation: "document_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_encryption_keys_owner_id_fkey"
            columns: ["owner_id"]
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
          company_phone: string | null
          country: string
          created_at: string
          current_period_end: string | null
          legal_name: string | null
          plan_id: string
          postal_code: string | null
          siret: string | null
          siret_verified_at: string | null
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
          company_phone?: string | null
          country?: string
          created_at?: string
          current_period_end?: string | null
          legal_name?: string | null
          plan_id?: string
          postal_code?: string | null
          siret?: string | null
          siret_verified_at?: string | null
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
          company_phone?: string | null
          country?: string
          created_at?: string
          current_period_end?: string | null
          legal_name?: string | null
          plan_id?: string
          postal_code?: string | null
          siret?: string | null
          siret_verified_at?: string | null
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
          cgv_accepted_at: string | null
          cgv_version: string | null
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
          cgv_accepted_at?: string | null
          cgv_version?: string | null
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
          cgv_accepted_at?: string | null
          cgv_version?: string | null
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
          automated: boolean
          candidature_id: string
          contenu: string
          created_at: string
          destinataire_id: string
          expedition_id: string
          id: string
          lu: boolean
        }
        Insert: {
          automated?: boolean
          candidature_id: string
          contenu: string
          created_at?: string
          destinataire_id: string
          expedition_id: string
          id?: string
          lu?: boolean
        }
        Update: {
          automated?: boolean
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
      admin_decide_offer_report: {
        Args: {
          p_decision: string
          p_reason: string
          p_report_id: string
        }
        Returns: Json
      }
      get_platform_security_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          activated_at: string | null
          auto_triggered: boolean
          documents_locked: boolean
          incident_mode: boolean
          public_message: string
          sensitive_writes_locked: boolean
          severity: string
          updated_at: string
        }[]
      }
      get_account_deletion_feedback_summary: {
        Args: {
          p_days?: number
        }
        Returns: {
          deletion_count: number
          departure_reason: string
        }[]
      }
      get_recent_account_deletion_feedback: {
        Args: {
          p_limit?: number
        }
        Returns: {
          departure_feedback: string | null
          departure_reason: string
          requested_at: string
          result: string
        }[]
      }
      platform_admin_has_mfa: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      platform_documents_available: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_platform_incident_mode: {
        Args: {
          p_documents_locked: boolean
          p_incident_mode: boolean
          p_reason: string
          p_sensitive_writes_locked: boolean
        }
        Returns: {
          activated_at: string | null
          activated_by: string | null
          auto_triggered: boolean
          documents_locked: boolean
          id: boolean
          incident_mode: boolean
          public_message: string
          reason: string | null
          sensitive_writes_locked: boolean
          severity: string
          updated_at: string
        }[]
      }
      record_current_legal_acknowledgement: {
        Args: {
          p_privacy_notice_version: string
          p_source?: string
          p_terms_version: string
        }
        Returns: string
      }
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
      log_document_access: {
        Args: {
          p_action: string
          p_storage_path?: string | null
          p_file_name?: string | null
          p_document_request_id?: string | null
          p_metadata?: Json
        }
        Returns: undefined
      }
      record_document_receipt: {
        Args: {
          p_receipt_method?: string
          p_storage_path: string
        }
        Returns: string | null
      }
      record_manual_document_deletion: {
        Args: {
          p_storage_path: string
        }
        Returns: undefined
      }
      list_candidature_document_records: {
        Args: {
          p_candidature_id: string
        }
        Returns: {
          category: string
          deletion_reason: string | null
          document_request_id: string | null
          expires_at: string | null
          original_file_name: string
          owner_id: string
          received_at: string | null
          recipient_id: string | null
          retention_flow: string
          sent_at: string
          storage_deleted_at: string | null
          storage_path: string
        }[]
      }
      touch_account_activity: {
        Args: {
          p_reactivate?: boolean
        }
        Returns: {
          is_suspended: boolean
          suspended_at: string | null
          suspension_reason: string | null
          reactivated: boolean
          last_seen_at: string
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
