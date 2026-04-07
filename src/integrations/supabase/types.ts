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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_preferences: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          instructions: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          instructions?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          instructions?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_audit_logs: {
        Row: {
          action: string
          cost: number | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          model: string | null
          node_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          cost?: number | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          model?: string | null
          node_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          cost?: number | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          model?: string | null
          node_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      asambleas: {
        Row: {
          condominio_id: string
          created_at: string | null
          descripcion: string | null
          fecha: string
          id: string
          link_reunion: string | null
          titulo: string
        }
        Insert: {
          condominio_id: string
          created_at?: string | null
          descripcion?: string | null
          fecha: string
          id?: string
          link_reunion?: string | null
          titulo: string
        }
        Update: {
          condominio_id?: string
          created_at?: string | null
          descripcion?: string | null
          fecha?: string
          id?: string
          link_reunion?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "asambleas_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_ratings: {
        Row: {
          asset_id: string | null
          created_at: string | null
          feedback_text: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_ratings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "saved_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_nodes: {
        Row: {
          asset_url: string | null
          created_at: string
          data_payload: Json | null
          error_message: string | null
          height: number
          id: string
          name: string | null
          pos_x: number
          pos_y: number
          prompt: string
          space_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          width: number
        }
        Insert: {
          asset_url?: string | null
          created_at?: string
          data_payload?: Json | null
          error_message?: string | null
          height?: number
          id?: string
          name?: string | null
          pos_x?: number
          pos_y?: number
          prompt: string
          space_id?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          width?: number
        }
        Update: {
          asset_url?: string | null
          created_at?: string
          data_payload?: Json | null
          error_message?: string | null
          height?: number
          id?: string
          name?: string | null
          pos_x?: number
          pos_y?: number
          prompt?: string
          space_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "canvas_nodes_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      condominios: {
        Row: {
          ciudad: string | null
          created_at: string | null
          direccion: string | null
          id: string
          nombre: string
          torres: number | null
        }
        Insert: {
          ciudad?: string | null
          created_at?: string | null
          direccion?: string | null
          id?: string
          nombre: string
          torres?: number | null
        }
        Update: {
          ciudad?: string | null
          created_at?: string | null
          direccion?: string | null
          id?: string
          nombre?: string
          torres?: number | null
        }
        Relationships: []
      }
      demo_usage: {
        Row: {
          fingerprint: string
          last_trial_at: string
          trials_used: number
        }
        Insert: {
          fingerprint: string
          last_trial_at?: string
          trials_used?: number
        }
        Update: {
          fingerprint?: string
          last_trial_at?: string
          trials_used?: number
        }
        Relationships: []
      }
      documentos_residencial: {
        Row: {
          condominio_id: string
          created_at: string | null
          id: string
          nombre: string
          tipo: string | null
          url: string
        }
        Insert: {
          condominio_id: string
          created_at?: string | null
          id?: string
          nombre: string
          tipo?: string | null
          url: string
        }
        Update: {
          condominio_id?: string
          created_at?: string | null
          id?: string
          nombre?: string
          tipo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_residencial_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component_stack: string | null
          created_at: string | null
          error_message: string
          id: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string | null
          error_message: string
          id?: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string | null
          error_message?: string
          id?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      github_connections: {
        Row: {
          access_token: string
          created_at: string
          github_username: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          github_username?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          github_username?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          credits_awarded: number
          id: string
          status: string
          stripe_invoice_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          credits_awarded: number
          id?: string
          status?: string
          stripe_invoice_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          credits_awarded?: number
          id?: string
          status?: string
          stripe_invoice_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notificaciones_residencial: {
        Row: {
          created_at: string | null
          id: string
          leida: boolean | null
          mensaje: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          mensaje: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      pagos_residencial: {
        Row: {
          created_at: string | null
          estado: string
          fecha_pago: string | null
          id: string
          monto: number
          referencia: string | null
          unidad_id: string
        }
        Insert: {
          created_at?: string | null
          estado?: string
          fecha_pago?: string | null
          id?: string
          monto: number
          referencia?: string | null
          unidad_id: string
        }
        Update: {
          created_at?: string | null
          estado?: string
          fecha_pago?: string | null
          id?: string
          monto?: number
          referencia?: string | null
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_residencial_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          credits_amount: number
          description: string | null
          id: string
          name: string
          popular: boolean | null
          price_display: string | null
          price_id: string
        }
        Insert: {
          created_at?: string | null
          credits_amount: number
          description?: string | null
          id?: string
          name: string
          popular?: boolean | null
          price_display?: string | null
          price_id: string
        }
        Update: {
          created_at?: string | null
          credits_amount?: number
          description?: string | null
          id?: string
          name?: string
          popular?: boolean | null
          price_display?: string | null
          price_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          condominio_id: string | null
          created_at: string
          credits_balance: number
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_active_at: string | null
          stripe_customer_id: string | null
          subscription_tier: string
          telefono: string | null
          updated_at: string
          user_id: string
          user_settings: Json | null
        }
        Insert: {
          avatar_url?: string | null
          condominio_id?: string | null
          created_at?: string
          credits_balance?: number
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string
          telefono?: string | null
          updated_at?: string
          user_id: string
          user_settings?: Json | null
        }
        Update: {
          avatar_url?: string | null
          condominio_id?: string | null
          created_at?: string
          credits_balance?: number
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
          user_settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_assets: {
        Row: {
          asset_url: string | null
          content: string | null
          created_at: string
          id: string
          is_favorite: boolean
          node_id: string | null
          prompt: string | null
          space_id: string | null
          tags: string[] | null
          type: string
          user_id: string
        }
        Insert: {
          asset_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          node_id?: string | null
          prompt?: string | null
          space_id?: string | null
          tags?: string[] | null
          type?: string
          user_id: string
        }
        Update: {
          asset_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          node_id?: string | null
          prompt?: string | null
          space_id?: string | null
          tags?: string[] | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_assets_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "canvas_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_assets_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_archived: boolean | null
          name: string
          settings: Json | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          settings?: Json | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          settings?: Json | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_conversations: {
        Row: {
          created_at: string
          id: string
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "studio_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_projects: {
        Row: {
          created_at: string
          description: string | null
          files: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          files?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          files?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          action: string | null
          amount: number
          created_at: string
          description: string | null
          id: string
          model_used: string | null
          node_id: string | null
          stripe_event_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          action?: string | null
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          model_used?: string | null
          node_id?: string | null
          stripe_event_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          action?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          model_used?: string | null
          node_id?: string | null
          stripe_event_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "canvas_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          condominio_id: string
          created_at: string | null
          id: string
          mora_actual: number | null
          numero: string
          propietario_id: string | null
          torre: string | null
        }
        Insert: {
          condominio_id: string
          created_at?: string | null
          id?: string
          mora_actual?: number | null
          numero: string
          propietario_id?: string | null
          torre?: string | null
        }
        Update: {
          condominio_id?: string
          created_at?: string | null
          id?: string
          mora_actual?: number | null
          numero?: string
          propietario_id?: string | null
          torre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidades_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_credits: {
        Args: { _amount: number; _reason?: string; _target_user_id: string }
        Returns: number
      }
      admin_deduct_credits: {
        Args: { _amount: number; _reason?: string; _target_user_id: string }
        Returns: number
      }
      admin_get_transactions: {
        Args: { _limit?: number; _target_user_id: string }
        Returns: {
          amount: number
          created_at: string
          description: string
          id: string
          type: string
        }[]
      }
      admin_get_user_roles: {
        Args: { _target_user_id: string }
        Returns: {
          granted_at: string
          role: string
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          credits_balance: number
          display_name: string
          email: string
          is_active: boolean
          last_sign_in: string
          subscription_tier: string
          user_id: string
        }[]
      }
      admin_refund_credits: {
        Args: { _amount: number; _reason?: string; _target_user_id: string }
        Returns: number
      }
      admin_set_role: {
        Args: { _grant?: boolean; _role: string; _target_user_id: string }
        Returns: string
      }
      admin_set_user_status: {
        Args: { _active: boolean; _target_user_id: string }
        Returns: undefined
      }
      admin_update_credits: {
        Args: { _new_balance: number; _target_user_id: string }
        Returns: undefined
      }
      admin_update_tier: {
        Args: { _new_tier: string; _target_user_id: string }
        Returns: undefined
      }
      bootstrap_admin: { Args: never; Returns: string }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      refund_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: boolean
      }
      spend_credits: {
        Args: {
          _action: string
          _amount: number
          _model: string
          _node_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "propietario" | "contador"
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
      app_role: ["admin", "moderator", "user", "propietario", "contador"],
    },
  },
} as const

