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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agenda_bloqueios: {
        Row: {
          created_at: string
          data: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          motivo: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_bloqueios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          autor_user_id: string | null
          created_at: string
          descricao: string
          id: string
          resposta_master: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          tenant_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_user_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          resposta_master?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          tenant_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_user_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          resposta_master?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          tenant_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          area: Database["public"]["Enums"]["reserva_area"] | null
          codigo_acompanhamento: string
          comandas: boolean | null
          created_at: string
          data: string | null
          horario: string | null
          id: string
          leva_bolo: boolean | null
          motivo_cancelamento: string | null
          nome: string
          observacoes: string | null
          quantidade: number | null
          status: Database["public"]["Enums"]["reserva_status"]
          telefone: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
          tipo_evento: string | null
          updated_at: string
        }
        Insert: {
          area?: Database["public"]["Enums"]["reserva_area"] | null
          codigo_acompanhamento: string
          comandas?: boolean | null
          created_at?: string
          data?: string | null
          horario?: string | null
          id?: string
          leva_bolo?: boolean | null
          motivo_cancelamento?: string | null
          nome: string
          observacoes?: string | null
          quantidade?: number | null
          status?: Database["public"]["Enums"]["reserva_status"]
          telefone: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
          tipo_evento?: string | null
          updated_at?: string
        }
        Update: {
          area?: Database["public"]["Enums"]["reserva_area"] | null
          codigo_acompanhamento?: string
          comandas?: boolean | null
          created_at?: string
          data?: string | null
          horario?: string | null
          id?: string
          leva_bolo?: boolean | null
          motivo_cancelamento?: string | null
          nome?: string
          observacoes?: string | null
          quantidade?: number | null
          status?: Database["public"]["Enums"]["reserva_status"]
          telefone?: string
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["reserva_tipo"]
          tipo_evento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ativo: boolean
          cor_primaria: string | null
          created_at: string
          email_contato: string | null
          endereco: string | null
          horario_limite_fim_semana: string | null
          horario_limite_semana: string | null
          id: string
          logo_url: string | null
          mensagem_cancelamento: string | null
          mensagem_confirmacao: string | null
          nome: string
          pixel_facebook_id: string | null
          slug: string
          telefone_contato: string | null
          tipos_aceitos: Database["public"]["Enums"]["reserva_tipo"][]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          cor_primaria?: string | null
          created_at?: string
          email_contato?: string | null
          endereco?: string | null
          horario_limite_fim_semana?: string | null
          horario_limite_semana?: string | null
          id?: string
          logo_url?: string | null
          mensagem_cancelamento?: string | null
          mensagem_confirmacao?: string | null
          nome: string
          pixel_facebook_id?: string | null
          slug: string
          telefone_contato?: string | null
          tipos_aceitos?: Database["public"]["Enums"]["reserva_tipo"][]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          cor_primaria?: string | null
          created_at?: string
          email_contato?: string | null
          endereco?: string | null
          horario_limite_fim_semana?: string | null
          horario_limite_semana?: string | null
          id?: string
          logo_url?: string | null
          mensagem_cancelamento?: string | null
          mensagem_confirmacao?: string | null
          nome?: string
          pixel_facebook_id?: string | null
          slug?: string
          telefone_contato?: string | null
          tipos_aceitos?: Database["public"]["Enums"]["reserva_tipo"][]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bloqueios_do_tenant: {
        Args: { _slug: string }
        Returns: {
          data: string
          hora_fim: string
          hora_inicio: string
          motivo: string
        }[]
      }
      criar_reserva: {
        Args: {
          _area?: Database["public"]["Enums"]["reserva_area"]
          _comandas?: boolean
          _data: string
          _horario?: string
          _leva_bolo?: boolean
          _nome: string
          _observacoes?: string
          _quantidade: number
          _slug: string
          _telefone: string
          _tipo: Database["public"]["Enums"]["reserva_tipo"]
          _tipo_evento?: string
        }
        Returns: string
      }
      get_my_tenant_id: { Args: never; Returns: string }
      get_reserva_by_codigo: {
        Args: { _codigo: string }
        Returns: {
          area: Database["public"]["Enums"]["reserva_area"] | null
          codigo_acompanhamento: string
          comandas: boolean | null
          created_at: string
          data: string | null
          horario: string | null
          id: string
          leva_bolo: boolean | null
          motivo_cancelamento: string | null
          nome: string
          observacoes: string | null
          quantidade: number | null
          status: Database["public"]["Enums"]["reserva_status"]
          telefone: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
          tipo_evento: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "reservas"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      update_reserva_by_codigo: {
        Args: {
          _area: Database["public"]["Enums"]["reserva_area"]
          _codigo: string
          _data: string
          _horario: string
          _observacoes: string
          _quantidade: number
        }
        Returns: {
          area: Database["public"]["Enums"]["reserva_area"] | null
          codigo_acompanhamento: string
          comandas: boolean | null
          created_at: string
          data: string | null
          horario: string | null
          id: string
          leva_bolo: boolean | null
          motivo_cancelamento: string | null
          nome: string
          observacoes: string | null
          quantidade: number | null
          status: Database["public"]["Enums"]["reserva_status"]
          telefone: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
          tipo_evento: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "super_admin" | "tenant_admin"
      feedback_status: "novo" | "em_analise" | "feito" | "recusado"
      reserva_area: "interna" | "externa" | "sem_preferencia"
      reserva_status: "pendente" | "confirmada" | "cancelada" | "finalizada"
      reserva_tipo: "mesa" | "aniversario" | "evento" | "casamento"
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
      app_role: ["super_admin", "tenant_admin"],
      feedback_status: ["novo", "em_analise", "feito", "recusado"],
      reserva_area: ["interna", "externa", "sem_preferencia"],
      reserva_status: ["pendente", "confirmada", "cancelada", "finalizada"],
      reserva_tipo: ["mesa", "aniversario", "evento", "casamento"],
    },
  },
} as const
