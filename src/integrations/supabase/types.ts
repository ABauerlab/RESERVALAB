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
      alteracoes_pendentes: {
        Row: {
          area_nova: Database["public"]["Enums"]["reserva_area"] | null
          created_at: string
          data_nova: string | null
          horario_nova: string | null
          id: string
          motivo: string
          observacoes_nova: string | null
          quantidade_nova: number | null
          reserva_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          area_nova?: Database["public"]["Enums"]["reserva_area"] | null
          created_at?: string
          data_nova?: string | null
          horario_nova?: string | null
          id?: string
          motivo?: string
          observacoes_nova?: string | null
          quantidade_nova?: number | null
          reserva_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          area_nova?: Database["public"]["Enums"]["reserva_area"] | null
          created_at?: string
          data_nova?: string | null
          horario_nova?: string | null
          id?: string
          motivo?: string
          observacoes_nova?: string | null
          quantidade_nova?: number | null
          reserva_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alteracoes_pendentes_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alteracoes_pendentes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      atracoes: {
        Row: {
          atualizado_por: string | null
          cache_valor: number | null
          contato: string | null
          created_at: string
          criado_por: string | null
          data: string
          descricao_publica: string | null
          destaque: boolean
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          imagem_altura: number | null
          imagem_largura: number | null
          imagem_url: string | null
          observacoes: string | null
          status: string
          tenant_id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          atualizado_por?: string | null
          cache_valor?: number | null
          contato?: string | null
          created_at?: string
          criado_por?: string | null
          data: string
          descricao_publica?: string | null
          destaque?: boolean
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          imagem_altura?: number | null
          imagem_largura?: number | null
          imagem_url?: string | null
          observacoes?: string | null
          status?: string
          tenant_id: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          atualizado_por?: string | null
          cache_valor?: number | null
          contato?: string | null
          created_at?: string
          criado_por?: string | null
          data?: string
          descricao_publica?: string | null
          destaque?: boolean
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          imagem_altura?: number | null
          imagem_largura?: number | null
          imagem_url?: string | null
          observacoes?: string | null
          status?: string
          tenant_id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atracoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cardapio_categorias: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardapio_categorias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cardapio_itens: {
        Row: {
          ativo: boolean
          categoria_id: string
          created_at: string
          descricao: string | null
          destaque: boolean
          id: string
          imagem_url: string | null
          nome: string
          ordem: number
          preco_centavos: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          id?: string
          imagem_url?: string | null
          nome: string
          ordem?: number
          preco_centavos?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          id?: string
          imagem_url?: string | null
          nome?: string
          ordem?: number
          preco_centavos?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardapio_itens_categoria_id_tenant_id_fkey"
            columns: ["categoria_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "cardapio_categorias"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "cardapio_itens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_destaque: {
        Row: {
          atracao_id: string | null
          created_at: string
          data: string
          descricao: string | null
          horario: string | null
          id: string
          imagem_altura: number | null
          imagem_largura: number | null
          imagem_url: string | null
          tenant_id: string
          titulo: string
        }
        Insert: {
          atracao_id?: string | null
          created_at?: string
          data: string
          descricao?: string | null
          horario?: string | null
          id?: string
          imagem_altura?: number | null
          imagem_largura?: number | null
          imagem_url?: string | null
          tenant_id: string
          titulo: string
        }
        Update: {
          atracao_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          horario?: string | null
          id?: string
          imagem_altura?: number | null
          imagem_largura?: number | null
          imagem_url?: string | null
          tenant_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_destaque_atracao_id_fkey"
            columns: ["atracao_id"]
            isOneToOne: true
            referencedRelation: "atracoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_destaque_tenant_id_fkey"
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
      feriados: {
        Row: {
          created_at: string
          data: string
          id: string
          motivo: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          motivo?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          motivo?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feriados_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_especiais: {
        Row: {
          created_at: string
          data: string
          horario_limite: string
          id: string
          motivo: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          data: string
          horario_limite: string
          id?: string
          motivo?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          data?: string
          horario_limite?: string
          id?: string
          motivo?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_especiais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_links: {
        Row: {
          ativo: boolean
          created_at: string
          destaque: boolean
          icone: string | null
          icone_url: string | null
          id: string
          ordem: number
          tenant_id: string
          titulo: string
          updated_at: string
          url: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          destaque?: boolean
          icone?: string | null
          icone_url?: string | null
          id?: string
          ordem?: number
          tenant_id: string
          titulo: string
          updated_at?: string
          url: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          destaque?: boolean
          icone?: string | null
          icone_url?: string | null
          id?: string
          ordem?: number
          tenant_id?: string
          titulo?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_agente_config: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          dominio_publico: string
          tenant_slug: string
          whatsapp_ativo: boolean
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          dominio_publico?: string
          tenant_slug: string
          whatsapp_ativo?: boolean
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          dominio_publico?: string
          tenant_slug?: string
          whatsapp_ativo?: boolean
        }
        Relationships: []
      }
      ia_base_conhecimento: {
        Row: {
          conteudo: string
          tenant_slug: string
          updated_at: string
        }
        Insert: {
          conteudo: string
          tenant_slug: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          tenant_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ia_conversa_pausa: {
        Row: {
          criado_em: string
          criado_por: string | null
          pausado_ate: string | null
          telefone: string
          telefone_chave: string
          tenant_slug: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          pausado_ate?: string | null
          telefone: string
          telefone_chave: string
          tenant_slug: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          pausado_ate?: string | null
          telefone?: string
          telefone_chave?: string
          tenant_slug?: string
        }
        Relationships: []
      }
      ia_msg_buffer: {
        Row: {
          consumido: boolean
          criado_em: string
          id: number
          msg_id: string | null
          telefone: string
          telefone_chave: string
          tenant_slug: string
          texto: string
        }
        Insert: {
          consumido?: boolean
          criado_em?: string
          id?: number
          msg_id?: string | null
          telefone: string
          telefone_chave: string
          tenant_slug: string
          texto: string
        }
        Update: {
          consumido?: boolean
          criado_em?: string
          id?: number
          msg_id?: string | null
          telefone?: string
          telefone_chave?: string
          tenant_slug?: string
          texto?: string
        }
        Relationships: []
      }
      n8n_chat_histories_iracema: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_chat_histories_iracema_instagram: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notificacoes_grupo_reservas: {
        Row: {
          created_at: string
          enviado: boolean
          enviado_em: string | null
          estado_antes_texto: string | null
          id: string
          lista_enviada: boolean
          processando_em: string | null
          reserva_id: string
          resumo: string
          resumo_enviado: boolean
          tenant_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          enviado?: boolean
          enviado_em?: string | null
          estado_antes_texto?: string | null
          id?: string
          lista_enviada?: boolean
          processando_em?: string | null
          reserva_id: string
          resumo: string
          resumo_enviado?: boolean
          tenant_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          enviado?: boolean
          enviado_em?: string | null
          estado_antes_texto?: string | null
          id?: string
          lista_enviada?: boolean
          processando_em?: string | null
          reserva_id?: string
          resumo?: string
          resumo_enviado?: boolean
          tenant_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_grupo_reservas_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_grupo_reservas_tenant_id_fkey"
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
          alerta_mesa_grande_enviado: boolean
          area: Database["public"]["Enums"]["reserva_area"] | null
          aviso_confirmacao_2d_enviado: boolean
          aviso_confirmacao_7d_enviado: boolean
          codigo_acompanhamento: string
          comandas: boolean | null
          confirmacao_manual_necessaria: boolean
          created_at: string
          data: string | null
          horario: string | null
          id: string
          lembrete_24h_enviado: boolean
          leva_bolo: boolean | null
          motivo_cancelamento: string | null
          nome: string
          observacoes: string | null
          quantidade: number | null
          reconfirmacao_chat_base: number | null
          reconfirmacao_enviada_em: string | null
          reconfirmada_em: string | null
          status: Database["public"]["Enums"]["reserva_status"]
          telefone: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
          tipo_evento: string | null
          updated_at: string
        }
        Insert: {
          alerta_mesa_grande_enviado?: boolean
          area?: Database["public"]["Enums"]["reserva_area"] | null
          aviso_confirmacao_2d_enviado?: boolean
          aviso_confirmacao_7d_enviado?: boolean
          codigo_acompanhamento: string
          comandas?: boolean | null
          confirmacao_manual_necessaria?: boolean
          created_at?: string
          data?: string | null
          horario?: string | null
          id?: string
          lembrete_24h_enviado?: boolean
          leva_bolo?: boolean | null
          motivo_cancelamento?: string | null
          nome: string
          observacoes?: string | null
          quantidade?: number | null
          reconfirmacao_chat_base?: number | null
          reconfirmacao_enviada_em?: string | null
          reconfirmada_em?: string | null
          status?: Database["public"]["Enums"]["reserva_status"]
          telefone: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
          tipo_evento?: string | null
          updated_at?: string
        }
        Update: {
          alerta_mesa_grande_enviado?: boolean
          area?: Database["public"]["Enums"]["reserva_area"] | null
          aviso_confirmacao_2d_enviado?: boolean
          aviso_confirmacao_7d_enviado?: boolean
          codigo_acompanhamento?: string
          comandas?: boolean | null
          confirmacao_manual_necessaria?: boolean
          created_at?: string
          data?: string | null
          horario?: string | null
          id?: string
          lembrete_24h_enviado?: boolean
          leva_bolo?: boolean | null
          motivo_cancelamento?: string | null
          nome?: string
          observacoes?: string | null
          quantidade?: number | null
          reconfirmacao_chat_base?: number | null
          reconfirmacao_enviada_em?: string | null
          reconfirmada_em?: string | null
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
      solicitacoes_confirmacao_manual: {
        Row: {
          enviado: boolean
          enviado_em: string | null
          erro: string | null
          id: string
          processando_em: string | null
          reserva_id: string
          solicitado_em: string
          solicitado_por: string | null
          tenant_id: string
        }
        Insert: {
          enviado?: boolean
          enviado_em?: string | null
          erro?: string | null
          id?: string
          processando_em?: string | null
          reserva_id: string
          solicitado_em?: string
          solicitado_por?: string | null
          tenant_id: string
        }
        Update: {
          enviado?: boolean
          enviado_em?: string | null
          erro?: string | null
          id?: string
          processando_em?: string | null
          reserva_id?: string
          solicitado_em?: string
          solicitado_por?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_confirmacao_manual_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_confirmacao_manual_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_perfil: {
        Row: {
          cardapio_layout: string | null
          cardapio_publicado: boolean
          created_at: string
          hub_banner_ativo: boolean
          hub_banner_url: string | null
          hub_descricao: string | null
          hub_mapa_url: string | null
          hub_mostrar_cardapio: boolean
          hub_publicado: boolean
          hub_selo: string | null
          instagram: string | null
          marca_ativa: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cardapio_layout?: string | null
          cardapio_publicado?: boolean
          created_at?: string
          hub_banner_ativo?: boolean
          hub_banner_url?: string | null
          hub_descricao?: string | null
          hub_mapa_url?: string | null
          hub_mostrar_cardapio?: boolean
          hub_publicado?: boolean
          hub_selo?: string | null
          instagram?: string | null
          marca_ativa?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cardapio_layout?: string | null
          cardapio_publicado?: boolean
          created_at?: string
          hub_banner_ativo?: boolean
          hub_banner_url?: string | null
          hub_descricao?: string | null
          hub_mapa_url?: string | null
          hub_mostrar_cardapio?: boolean
          hub_publicado?: boolean
          hub_selo?: string | null
          instagram?: string | null
          marca_ativa?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_perfil_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_planos: {
        Row: {
          ciclo: string
          created_at: string
          observacao: string | null
          plano: string
          tenant_id: string
          updated_at: string
          vigente_ate: string | null
        }
        Insert: {
          ciclo?: string
          created_at?: string
          observacao?: string | null
          plano: string
          tenant_id: string
          updated_at?: string
          vigente_ate?: string | null
        }
        Update: {
          ciclo?: string
          created_at?: string
          observacao?: string | null
          plano?: string
          tenant_id?: string
          updated_at?: string
          vigente_ate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_planos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ativo: boolean
          capacidade_pessoas_dia: number | null
          capacidade_pessoas_horario: number | null
          cor_primaria: string | null
          created_at: string
          email_contato: string | null
          endereco: string | null
          horario_limite_fim_semana: string | null
          horario_limite_sabado: string | null
          horario_limite_semana: string | null
          id: string
          logo_url: string | null
          mensagem_cancelamento: string | null
          mensagem_confirmacao: string | null
          mensagem_reconfirmacao: string | null
          nome: string
          observacao_area: string | null
          pixel_facebook_id: string | null
          slug: string
          telefone_contato: string | null
          tipos_aceitos: Database["public"]["Enums"]["reserva_tipo"][]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          capacidade_pessoas_dia?: number | null
          capacidade_pessoas_horario?: number | null
          cor_primaria?: string | null
          created_at?: string
          email_contato?: string | null
          endereco?: string | null
          horario_limite_fim_semana?: string | null
          horario_limite_sabado?: string | null
          horario_limite_semana?: string | null
          id?: string
          logo_url?: string | null
          mensagem_cancelamento?: string | null
          mensagem_confirmacao?: string | null
          mensagem_reconfirmacao?: string | null
          nome: string
          observacao_area?: string | null
          pixel_facebook_id?: string | null
          slug: string
          telefone_contato?: string | null
          tipos_aceitos?: Database["public"]["Enums"]["reserva_tipo"][]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          capacidade_pessoas_dia?: number | null
          capacidade_pessoas_horario?: number | null
          cor_primaria?: string | null
          created_at?: string
          email_contato?: string | null
          endereco?: string | null
          horario_limite_fim_semana?: string | null
          horario_limite_sabado?: string | null
          horario_limite_semana?: string | null
          id?: string
          logo_url?: string | null
          mensagem_cancelamento?: string | null
          mensagem_confirmacao?: string | null
          mensagem_reconfirmacao?: string | null
          nome?: string
          observacao_area?: string | null
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
      agente_alterar_reserva: {
        Args: {
          _area?: string
          _codigo: string
          _data?: string
          _horario?: string
          _observacoes?: string
          _quantidade?: number
          _slug: string
          _telefone: string
        }
        Returns: Json
      }
      base_conhecimento_do_tenant: { Args: { _slug: string }; Returns: string }
      base_conhecimento_final: { Args: { _slug: string }; Returns: string }
      bloqueios_do_tenant: {
        Args: { _slug: string }
        Returns: {
          data: string
          hora_fim: string
          hora_inicio: string
          motivo: string
        }[]
      }
      cancelar_reserva_por_codigo: {
        Args: { _codigo: string; _motivo?: string }
        Returns: {
          alerta_mesa_grande_enviado: boolean
          area: Database["public"]["Enums"]["reserva_area"] | null
          aviso_confirmacao_2d_enviado: boolean
          aviso_confirmacao_7d_enviado: boolean
          codigo_acompanhamento: string
          comandas: boolean | null
          confirmacao_manual_necessaria: boolean
          created_at: string
          data: string | null
          horario: string | null
          id: string
          lembrete_24h_enviado: boolean
          leva_bolo: boolean | null
          motivo_cancelamento: string | null
          nome: string
          observacoes: string | null
          quantidade: number | null
          reconfirmacao_chat_base: number | null
          reconfirmacao_enviada_em: string | null
          reconfirmada_em: string | null
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
      capacidade_do_dia: {
        Args: { _data: string; _slug: string }
        Returns: Json
      }
      cardapio_do_tenant: { Args: { _slug: string }; Returns: Json }
      confirmar_reserva_por_codigo: {
        Args: { _codigo: string }
        Returns: {
          codigo_acompanhamento: string
          id: string
          nome: string
          status: Database["public"]["Enums"]["reserva_status"]
          telefone: string
        }[]
      }
      confirmar_reserva_sem_notificar: {
        Args: { _id: string }
        Returns: {
          alerta_mesa_grande_enviado: boolean
          area: Database["public"]["Enums"]["reserva_area"] | null
          aviso_confirmacao_2d_enviado: boolean
          aviso_confirmacao_7d_enviado: boolean
          codigo_acompanhamento: string
          comandas: boolean | null
          confirmacao_manual_necessaria: boolean
          created_at: string
          data: string | null
          horario: string | null
          id: string
          lembrete_24h_enviado: boolean
          leva_bolo: boolean | null
          motivo_cancelamento: string | null
          nome: string
          observacoes: string | null
          quantidade: number | null
          reconfirmacao_chat_base: number | null
          reconfirmacao_enviada_em: string | null
          reconfirmada_em: string | null
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
      evento_destaque_do_tenant: {
        Args: { _slug: string }
        Returns: {
          data: string
          descricao: string
          horario: string
          imagem_altura: number
          imagem_largura: number
          imagem_url: string
          titulo: string
        }[]
      }
      eventos_em_destaque_do_tenant: {
        Args: { _slug: string }
        Returns: {
          data: string
          descricao: string
          horario: string
          horario_fim: string
          tipo: string
          titulo: string
        }[]
      }
      feriados_do_tenant: {
        Args: { _slug: string }
        Returns: {
          data: string
          motivo: string
        }[]
      }
      get_my_tenant_id: { Args: never; Returns: string }
      get_reserva_by_codigo: {
        Args: { _codigo: string }
        Returns: {
          alerta_mesa_grande_enviado: boolean
          area: Database["public"]["Enums"]["reserva_area"] | null
          aviso_confirmacao_2d_enviado: boolean
          aviso_confirmacao_7d_enviado: boolean
          codigo_acompanhamento: string
          comandas: boolean | null
          confirmacao_manual_necessaria: boolean
          created_at: string
          data: string | null
          horario: string | null
          id: string
          lembrete_24h_enviado: boolean
          leva_bolo: boolean | null
          motivo_cancelamento: string | null
          nome: string
          observacoes: string | null
          quantidade: number | null
          reconfirmacao_chat_base: number | null
          reconfirmacao_enviada_em: string | null
          reconfirmada_em: string | null
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
      hub_do_tenant: { Args: { _slug: string }; Returns: Json }
      ia_base_limpar_blocos_vencidos: { Args: never; Returns: number }
      ia_buffer_add: {
        Args: {
          _msg_id?: string
          _slug: string
          _telefone: string
          _texto: string
        }
        Returns: Json
      }
      ia_buffer_coletar: {
        Args: { _buffer_id: number; _slug: string; _telefone: string }
        Returns: Json
      }
      ia_contexto_ao_vivo: { Args: { _slug: string }; Returns: string }
      ia_dominio_publico: { Args: { _slug: string }; Returns: string }
      ia_fmt_data_br: { Args: { _d: string }; Returns: string }
      ia_fmt_hora: { Args: { _h: string }; Returns: string }
      ia_resumo_reserva: {
        Args: { _r: Database["public"]["Tables"]["reservas"]["Row"] }
        Returns: string
      }
      ia_tel_chave: { Args: { _tel: string }; Returns: string }
      ia_whatsapp_definir_conversa: {
        Args: {
          _horas?: number
          _pausado: boolean
          _slug: string
          _telefone: string
        }
        Returns: Json
      }
      ia_whatsapp_definir_global: {
        Args: { _ativo: boolean; _slug: string }
        Returns: Json
      }
      ia_whatsapp_deve_responder: {
        Args: { _slug: string; _telefone: string }
        Returns: boolean
      }
      ia_whatsapp_estado: { Args: { _slug: string }; Returns: Json }
      lista_reservas_confirmadas_grupo: {
        Args: { _slug: string }
        Returns: {
          area: string
          codigo: string
          data: string
          horario: string
          nome: string
          observacoes: string
          quantidade: number
          telefone: string
          tipo_evento: string
        }[]
      }
      marca_do_tenant: { Args: { _slug: string }; Returns: Json }
      marcar_alerta_mesa_grande_enviado: {
        Args: { _id: string }
        Returns: undefined
      }
      marcar_aviso_2d_enviado: { Args: { _id: string }; Returns: undefined }
      marcar_aviso_7d_enviado: { Args: { _id: string }; Returns: undefined }
      marcar_lembrete_24h_enviado: { Args: { _id: string }; Returns: undefined }
      marcar_reconfirmacao_enviada: {
        Args: { _id: string }
        Returns: undefined
      }
      normalizar_telefone_br: { Args: { _tel: string }; Returns: string }
      painel_reservas_grandes: {
        Args: { _min_pessoas?: number; _slug: string }
        Returns: {
          codigo_acompanhamento: string
          data: string
          horario: string
          id: string
          nome: string
          quantidade: number
          reconfirmacao_enviada_em: string
          reconfirmada_em: string
          situacao: string
          status: Database["public"]["Enums"]["reserva_status"]
          telefone: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
          ultima_resposta: string
        }[]
      }
      proximo_evento_do_tenant: {
        Args: { _slug: string }
        Returns: {
          data: string
          descricao: string
          horario: string
          imagem_url: string
          titulo: string
        }[]
      }
      reserva_por_telefone_do_tenant: {
        Args: { _slug: string; _telefone: string }
        Returns: {
          area: Database["public"]["Enums"]["reserva_area"]
          codigo_acompanhamento: string
          created_at: string
          data: string
          horario: string
          nome: string
          quantidade: number
          status: Database["public"]["Enums"]["reserva_status"]
          tipo: Database["public"]["Enums"]["reserva_tipo"]
        }[]
      }
      reservas_mesa_grande_a_classificar: {
        Args: { _min_pessoas?: number; _slug: string }
        Returns: {
          codigo_acompanhamento: string
          data: string
          horario: string
          id: string
          nome: string
          quantidade: number
          status: Database["public"]["Enums"]["reserva_status"]
          telefone: string
        }[]
      }
      reservas_para_aviso_2d: {
        Args: { _slug: string }
        Returns: {
          codigo_acompanhamento: number
          data: string
          dias_restantes: number
          horario: string
          id: string
          nome: string
          quantidade: number
          telefone: string
          tenant_nome: string
          tenant_slug: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
        }[]
      }
      reservas_para_aviso_7d: {
        Args: { _slug: string }
        Returns: {
          codigo_acompanhamento: string
          data: string
          dias_restantes: number
          horario: string
          id: string
          nome: string
          quantidade: number
          telefone: string
          tenant_nome: string
          tenant_slug: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
        }[]
      }
      reservas_para_aviso_pendente_2d: {
        Args: { _slug: string }
        Returns: {
          codigo_acompanhamento: string
          data: string
          dias_restantes: number
          horario: string
          id: string
          nome: string
          quantidade: number
          telefone: string
          tenant_nome: string
          tenant_slug: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
        }[]
      }
      reservas_para_lembrete_24h: {
        Args: { _slug: string }
        Returns: {
          codigo_acompanhamento: string
          data: string
          horario: string
          id: string
          nome: string
          telefone: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
        }[]
      }
      reservas_para_reconfirmacao_grande: {
        Args: { _dias?: number; _min_pessoas?: number; _slug: string }
        Returns: {
          codigo_acompanhamento: string
          data: string
          dias_restantes: number
          horario: string
          id: string
          nome: string
          quantidade: number
          status: Database["public"]["Enums"]["reserva_status"]
          telefone: string
          tenant_nome: string
          tenant_slug: string
          tipo: Database["public"]["Enums"]["reserva_tipo"]
        }[]
      }
      solicitar_confirmacao_manual: {
        Args: { _reserva_id: string }
        Returns: Json
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
          alerta_mesa_grande_enviado: boolean
          area: Database["public"]["Enums"]["reserva_area"] | null
          aviso_confirmacao_2d_enviado: boolean
          aviso_confirmacao_7d_enviado: boolean
          codigo_acompanhamento: string
          comandas: boolean | null
          confirmacao_manual_necessaria: boolean
          created_at: string
          data: string | null
          horario: string | null
          id: string
          lembrete_24h_enviado: boolean
          leva_bolo: boolean | null
          motivo_cancelamento: string | null
          nome: string
          observacoes: string | null
          quantidade: number | null
          reconfirmacao_chat_base: number | null
          reconfirmacao_enviada_em: string | null
          reconfirmada_em: string | null
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
      reserva_area:
        | "interna"
        | "externa"
        | "sem_preferencia"
        | "salao"
        | "fundos"
        | "corredor"
        | "varanda"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      reserva_area: [
        "interna",
        "externa",
        "sem_preferencia",
        "salao",
        "fundos",
        "corredor",
        "varanda",
      ],
      reserva_status: ["pendente", "confirmada", "cancelada", "finalizada"],
      reserva_tipo: ["mesa", "aniversario", "evento", "casamento"],
    },
  },
} as const
