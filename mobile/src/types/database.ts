export type UserRole = "talent" | "entreprise";

type TableDef<Row, Insert = Row, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        {
          user_id: string;
          role: UserRole;
          email: string | null;
          full_name: string | null;
          prenom: string | null;
          nom: string | null;
          company_name: string | null;
          poste: string | null;
          localisation: string | null;
          adresse: string | null;
          contrat: string | null;
          secteur: string | null;
          competences: string | null;
          bio: string | null;
          telephone: string | null;
          telephone2: string | null;
          notification_offres_email: boolean | null;
        },
        {
          user_id: string;
          role: UserRole;
          email?: string | null;
          full_name?: string | null;
          prenom?: string | null;
          nom?: string | null;
          company_name?: string | null;
          poste?: string | null;
          localisation?: string | null;
          adresse?: string | null;
          contrat?: string | null;
          secteur?: string | null;
          competences?: string | null;
          bio?: string | null;
          telephone?: string | null;
          telephone2?: string | null;
          notification_offres_email?: boolean | null;
        },
        {
          user_id?: string;
          role?: UserRole;
          email?: string | null;
          full_name?: string | null;
          prenom?: string | null;
          nom?: string | null;
          company_name?: string | null;
          poste?: string | null;
          localisation?: string | null;
          adresse?: string | null;
          contrat?: string | null;
          secteur?: string | null;
          competences?: string | null;
          bio?: string | null;
          telephone?: string | null;
          telephone2?: string | null;
          notification_offres_email?: boolean | null;
        }
      >;
      offres: TableDef<
        {
          id: string;
          titre: string;
          contrat: string | null;
          localisation: string | null;
          secteur: string | null;
          salaire_min: number | null;
          salaire_max: number | null;
          statut: string | null;
          entreprise_id: string;
          created_at: string;
        },
        {
          id?: string;
          titre: string;
          contrat?: string | null;
          localisation?: string | null;
          secteur?: string | null;
          salaire_min?: number | null;
          salaire_max?: number | null;
          statut?: string | null;
          entreprise_id: string;
          created_at?: string;
        },
        {
          id?: string;
          titre?: string;
          contrat?: string | null;
          localisation?: string | null;
          secteur?: string | null;
          salaire_min?: number | null;
          salaire_max?: number | null;
          statut?: string | null;
          entreprise_id?: string;
          created_at?: string;
        }
      >;
      candidatures: TableDef<
        {
          id: string;
          offre_id: string;
          talent_id: string;
          statut: string | null;
          note: number | null;
          created_at: string;
        },
        {
          id?: string;
          offre_id: string;
          talent_id: string;
          statut?: string | null;
          note?: number | null;
          created_at?: string;
        },
        {
          id?: string;
          offre_id?: string;
          talent_id?: string;
          statut?: string | null;
          note?: number | null;
          created_at?: string;
        }
      >;
      messages: TableDef<
        {
          id: string;
          candidature_id: string;
          expedition_id: string;
          destinataire_id: string;
          contenu: string;
          lu: boolean;
          created_at: string;
        },
        {
          id?: string;
          candidature_id: string;
          expedition_id: string;
          destinataire_id: string;
          contenu: string;
          lu?: boolean;
          created_at?: string;
        },
        {
          id?: string;
          candidature_id?: string;
          expedition_id?: string;
          destinataire_id?: string;
          contenu?: string;
          lu?: boolean;
          created_at?: string;
        }
      >;
      document_requests: TableDef<
        {
          id: string;
          candidature_id: string;
          entreprise_id: string;
          talent_id: string;
          document_key: string;
          document_label: string;
          status: string;
          requested_at: string;
          created_at: string;
          uploaded_at: string | null;
        },
        {
          id?: string;
          candidature_id: string;
          entreprise_id: string;
          talent_id: string;
          document_key: string;
          document_label: string;
          status?: string;
          requested_at?: string;
          created_at?: string;
          uploaded_at?: string | null;
        },
        {
          id?: string;
          candidature_id?: string;
          entreprise_id?: string;
          talent_id?: string;
          document_key?: string;
          document_label?: string;
          status?: string;
          requested_at?: string;
          created_at?: string;
          uploaded_at?: string | null;
        }
      >;
    };
  };
};

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type OffreRow = Database["public"]["Tables"]["offres"]["Row"];
export type CandidatureRow = Database["public"]["Tables"]["candidatures"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type DocumentRequestRow = Database["public"]["Tables"]["document_requests"]["Row"];
