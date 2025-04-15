"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal, Edit, Trash, Mail, Phone, Calendar, CheckCircle, XCircle, AlertTriangle, FileText, Download, Share2 } from "lucide-react"
import { DetalhesLicitacao, Licitacao as LicitacaoComponentType } from "@/components/licitacoes/detalhes-licitacao"
import { DetalhesOrgao } from "@/components/licitacoes/detalhes-orgao"
import { FiltroLicitacoesOtimizado, LicitacaoFiltros } from "@/components/licitacoes/filtro-licitacoes-otimizado"
import { NovaLicitacao } from "@/components/licitacoes/nova-licitacao"
import { LicitacaoKanbanBoard } from "@/components/licitacoes/licitacao-kanban-board"
import type { Orgao as OrgaoType } from "@/components/licitacoes/detalhes-orgao"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'crmonefactory'
    }
  }
)

interface Licitacao {
  id: string;
  titulo: string;
  status: string;
  data_abertura: string;
  data_encerramento: string;
  valor_estimado: number;
  url_edital: string;
  url_licitacao: string;
  contato_email: string;
  contato_telefone: string;
  orgao: OrgaoType | string;
  responsavel: string;
  modalidade: string;
  objeto: string;
  edital: string;
  dataAbertura: string;
  valorEstimado: number;
  dataEncerramento: string;
  urlEdital: string;
  urlLicitacao: string;
  contatoEmail: string;
  contatoTelefone: string;
}

export default function LicitacoesPage() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLicitacao, setSelectedLicitacao] = useState<Licitacao | null>(null)
  const [selectedOrgao, setSelectedOrgao] = useState<OrgaoType | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [orgaoDetailsOpen, setOrgaoDetailsOpen] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState("lista")
  const [excluirLicitacaoId, setExcluirLicitacaoId] = useState<string | null>(null)
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false)
  const [filtros, setFiltros] = useState<LicitacaoFiltros>({})
  const [filteredLicitacoes, setFilteredLicitacoes] = useState<Licitacao[]>([])
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    ativas: 0,
    vencidas: 0,
    valorTotal: 0,
    pregoesProximos: 0,
    taxaSucesso: 0
  })

  // Extrair listas de valores únicos para os filtros
  const orgaos = filteredLicitacoes.map(item => item.orgao)
  const responsaveis = filteredLicitacoes.map(item => item.responsavel)
  const modalidades = filteredLicitacoes.map(item => item.modalidade)

  // Carregar dados da API
  const carregarLicitacoes = async () => {
    try {
      setLoading(true)
      
      // Montar parâmetros de consulta com base nos filtros
      const params = new URLSearchParams()
      
      if (filtros.termo) params.append('termo', filtros.termo)
      if (filtros.status) params.append('status', filtros.status)
      if (filtros.orgao) params.append('orgao', filtros.orgao)
      if (filtros.responsavel) params.append('responsavel', filtros.responsavel)
      if (filtros.modalidade) params.append('modalidade', filtros.modalidade)
      if (filtros.dataInicio) params.append('dataInicio', typeof filtros.dataInicio === 'string' ? filtros.dataInicio : format(filtros.dataInicio, 'yyyy-MM-dd'))
      if (filtros.dataFim) params.append('dataFim', typeof filtros.dataFim === 'string' ? filtros.dataFim : format(filtros.dataFim, 'yyyy-MM-dd'))
      if (filtros.valorMinimo) params.append('valorMin', filtros.valorMinimo.toString())
      if (filtros.valorMaximo) params.append('valorMax', filtros.valorMaximo.toString())
      
      // Obter token de autenticação
      const accessToken = localStorage.getItem('accessToken');
      
      console.log('Buscando licitações com parâmetros:', params.toString())
      const response = await fetch(`/api/licitacoes?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('Resposta não-OK da API:', response.status, errorData)
        throw new Error(`Resposta não-OK da API: ${response.status} "${errorData}"`)
      }
      
      const data = await response.json()
      console.log('Dados recebidos da API:', data)
      
      // Verificar se os dados recebidos são um array
      if (!Array.isArray(data)) {
        console.error('Dados recebidos não são um array:', data)
        setLicitacoes([])
        setFilteredLicitacoes([])
      } else {
        setLicitacoes(data)
        setFilteredLicitacoes(data)
      }

      // Carregar estatísticas
      try {
        const statsResponse = await fetch('/api/licitacoes?estatisticas=true', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setEstatisticas(statsData)
        } else {
          console.error('Erro ao buscar estatísticas:', statsResponse.status)
        }
      } catch (statsError) {
        console.error('Erro ao processar estatísticas:', statsError)
      }
    } catch (error) {
      console.error('Erro ao carregar licitações:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as licitações. Verifique o console para mais detalhes.",
        variant: "destructive"
      })
      setLicitacoes([])
      setFilteredLicitacoes([])
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    carregarLicitacoes()
  }, [])

  // Adicionar nova licitação
  const handleLicitacaoAdded = async (novaLicitacao: Licitacao) => {
    toast({
      title: "Sucesso!",
      description: "Licitação criada com sucesso.",
      variant: "default"
    })
    
    // Recarregar a lista após adicionar
    await carregarLicitacoes()
  }

  // Atualizar licitação
  const handleLicitacaoUpdate = async (licitacaoAtualizada: LicitacaoComponentType) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('licitacoes')
        .update({
          titulo: licitacaoAtualizada.titulo,
          status: licitacaoAtualizada.status,
          data_abertura: licitacaoAtualizada.dataAbertura,
          data_encerramento: licitacaoAtualizada.dataEncerramento,
          valor_estimado: licitacaoAtualizada.valorEstimado,
          url_edital: licitacaoAtualizada.urlEdital,
          url_licitacao: licitacaoAtualizada.urlLicitacao,
          contato_email: licitacaoAtualizada.contatoEmail,
          contato_telefone: licitacaoAtualizada.contatoTelefone,
          orgao_id: licitacaoAtualizada.orgao.id,
          responsavel: licitacaoAtualizada.responsavel,
          modalidade: licitacaoAtualizada.modalidade,
          objeto: licitacaoAtualizada.objeto,
          edital: licitacaoAtualizada.edital
        })
        .eq('id', licitacaoAtualizada.id)
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setLicitacoes(licitacoes.map(l => l.id === licitacaoAtualizada.id ? data[0] : l))
        toast({
          title: "Sucesso",
          description: "Licitação atualizada com sucesso",
          variant: "default"
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar licitação:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar licitação",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Confirmar exclusão de licitação
  const handleDeleteLicitacao = (licitacao: Licitacao) => {
    setExcluirLicitacaoId(licitacao.id)
    setDialogExcluirAberto(true)
  }

  // Excluir licitação
  const confirmDeleteLicitacao = async () => {
    if (!excluirLicitacaoId) return

    try {
      const response = await fetch(`/api/licitacoes/${excluirLicitacaoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir licitação')
      }

      toast({
        title: "Sucesso!",
        description: "Licitação excluída com sucesso.",
        variant: "default"
      })

      // Fechar e resetar os detalhes se a licitação excluída estiver aberta
      if (selectedLicitacao && selectedLicitacao.id === excluirLicitacaoId) {
        setDetailsOpen(false)
        setSelectedLicitacao(null)
      }

      // Recarregar a lista após excluir
      await carregarLicitacoes()
    } catch (error) {
      console.error('Erro ao excluir licitação:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a licitação.",
        variant: "destructive"
      })
    } finally {
      // Fechar o diálogo de confirmação
      setDialogExcluirAberto(false)
      setExcluirLicitacaoId(null)
    }
  }

  // Aplicar filtros localmente (quando necessário para filtros que a API não suporta)
  const handleFilterChange = (novosFiltros: LicitacaoFiltros) => {
    setFiltros(novosFiltros)
    
    // Para filtros que necessitam de resposta imediata na UI, aplicamos localmente também
    let filtered = [...licitacoes]
    
    // Aplicar filtros locais (complementares aos filtros da API)
    // Este trecho pode ser ajustado conforme necessidade
    
    setFilteredLicitacoes(filtered)
    
    // Recarregar da API com os novos filtros
    carregarLicitacoes()
  }

  // Formatar valor monetário
  const formatarValor = (valor: number | null | undefined): string => {
    if (valor === null || valor === undefined) {
      return 'R$ 0,00';
    }
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  // Formatar valor monetário de forma compacta para os cards
  const formatarValorCompacto = (valor: number): string => {
    if (valor >= 1000000) {
      return `${(valor / 1000000).toFixed(1)}M`
    } else if (valor >= 1000) {
      return `${(valor / 1000).toFixed(1)}K`
    } else {
      return valor.toLocaleString('pt-BR')
    }
  }

  // Abrir detalhes da licitação
  const handleLicitacaoClick = (licitacao: Licitacao) => {
    setSelectedLicitacao(licitacao)
    setDetailsOpen(true)
  }

  // Abrir detalhes do órgão
  const handleOrgaoClick = (orgaoNome: string) => {
    if (detailsOpen) {
      setDetailsOpen(false)
      setTimeout(() => {
        // Verificar se o órgão existe antes de abrir os detalhes
        try {
          // Usar nome do órgão como identificador temporário
          const orgao: OrgaoType = { 
            id: uuidv4(), // Este ID será usado apenas temporariamente até que dados reais sejam carregados
            nome: orgaoNome,
            status: "ativo" // Status padrão
          }
          setSelectedOrgao(orgao)
          setOrgaoDetailsOpen(true)
        } catch (error) {
          console.error('Erro ao preparar detalhes do órgão:', error);
          toast({
            title: "Erro",
            description: "Não foi possível exibir os detalhes do órgão.",
            variant: "destructive"
          })
        }
      }, 300)
    } else {
      try {
        // Usar nome do órgão como identificador temporário
        const orgao: OrgaoType = { 
          id: uuidv4(), // Este ID será usado apenas temporariamente até que dados reais sejam carregados
          nome: orgaoNome,
          status: "ativo" // Status padrão
        }
        setSelectedOrgao(orgao)
        setOrgaoDetailsOpen(true)
      } catch (error) {
        console.error('Erro ao preparar detalhes do órgão:', error);
        toast({
          title: "Erro",
          description: "Não foi possível exibir os detalhes do órgão.",
          variant: "destructive"
        })
      }
    }
  }

  // Atualizar status de uma licitação
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const licitacao = licitacoes.find(l => l.id === id)
    if (!licitacao) return
    
    try {
      // Obter token de autenticação
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        console.error('Token de autenticação não encontrado');
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado para realizar esta ação.",
          variant: "destructive"
        });
        return;
      }
      
      console.log(`Atualizando status da licitação ${id} para ${newStatus}`);
      
      const response = await fetch(`/api/licitacoes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      // Verificar resposta detalhada em caso de erro
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na resposta da API: ${response.status} - ${errorText}`);
        throw new Error(`Erro ao atualizar status da licitação: ${response.status} ${errorText}`)
      }
      
      // Atualizar localmente para feedback imediato ao usuário
      setLicitacoes(prevLicitacoes =>
        prevLicitacoes.map(lic => (lic.id === id ? { ...lic, status: newStatus } : lic))
      )
      
      setFilteredLicitacoes(prevFiltered =>
        prevFiltered.map(lic => (lic.id === id ? { ...lic, status: newStatus } : lic))
      )
      
      if (selectedLicitacao && selectedLicitacao.id === id) {
        setSelectedLicitacao(prev => (prev ? { ...prev, status: newStatus } : null))
      }
      
      toast({
        title: "Status atualizado",
        description: "O status da licitação foi atualizado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da licitação.",
        variant: "destructive"
      })
    }
  }

  // Atualizar órgão
  const handleOrgaoUpdate = (orgaoAtualizado: OrgaoType) => {
    // Aqui seria uma chamada de API para atualizar o órgão
    console.log("Órgão atualizado:", orgaoAtualizado)
    
    // Update the licitacoes list with the new orgao name if it changed
    if (orgaoAtualizado.nome !== selectedOrgao?.nome) {
      // Em um cenário real, precisaríamos atualizar todas as licitações associadas a este órgão
      toast({
        title: "Órgão atualizado",
        description: "O órgão foi atualizado com sucesso. As licitações associadas serão atualizadas.",
      })
    }
    
    // Update the selected orgao
    setSelectedOrgao(orgaoAtualizado)
  }

  // Excluir órgão
  const handleOrgaoDelete = (orgao: OrgaoType) => {
    // Em um cenário real, precisaríamos verificar se há licitações associadas
    toast({
      title: "Órgão excluído",
      description: "O órgão foi excluído com sucesso.",
    })
    
    setOrgaoDetailsOpen(false)
    setSelectedOrgao(null)
  }

  // Funções para ações na tabela
  const handleDownloadEdital = (licitacao: Licitacao) => {
    if (licitacao.url_edital) {
      window.open(licitacao.url_edital, '_blank')
    } else {
      toast({
        title: "Edital não disponível",
        description: "O edital desta licitação não está disponível para download.",
        variant: "destructive"
      })
    }
  }

  const handleShareLicitacao = (licitacao: Licitacao) => {
    // Simulação de compartilhamento
    const url = licitacao.url_licitacao || window.location.href
    
    // Em uma implementação real, usaríamos a Web Share API
    if (navigator.share) {
      navigator.share({
        title: licitacao.titulo,
        text: `Licitação: ${licitacao.titulo}`,
        url: url
      })
    } else {
      // Fallback: copiar link para área de transferência
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "Link copiado",
          description: "O link da licitação foi copiado para a área de transferência.",
        })
      })
    }
  }

  const handleSendEmail = (licitacao: Licitacao) => {
    const contato = licitacao.contato_email || ""
    if (contato) {
      window.location.href = `mailto:${contato}?subject=Licitação: ${licitacao.titulo}`
    } else {
      toast({
        title: "Email não disponível",
        description: "Não há um contato de email disponível para esta licitação.",
        variant: "destructive"
      })
    }
  }

  const handleScheduleCall = (licitacao: Licitacao) => {
    const telefone = licitacao.contato_telefone || ""
    if (telefone) {
      toast({
        title: "Ligação agendada",
        description: `Uma ligação foi agendada para o contato: ${telefone}`,
      })
    } else {
      toast({
        title: "Telefone não disponível",
        description: "Não há um contato telefônico disponível para esta licitação.",
        variant: "destructive"
      })
    }
  }

  const handleMarkAsWon = async (licitacao: Licitacao) => {
    await handleUpdateStatus(licitacao.id, "vencida")
  }

  const handleMarkAsLost = async (licitacao: Licitacao) => {
    await handleUpdateStatus(licitacao.id, "nao_vencida")
  }

  const handleOrgaoCreate = (orgaoNome: string) => {
    if (detailsOpen) {
      setDetailsOpen(false)
      setTimeout(() => {
        const orgao: OrgaoType = { 
          id: uuidv4(), 
          nome: orgaoNome,
          status: "ativo"
        }
        setSelectedOrgao(orgao)
        setOrgaoDetailsOpen(true)
      }, 300)
    } else {
      const orgao: OrgaoType = { 
        id: uuidv4(), 
        nome: orgaoNome,
        status: "ativo"
      }
      setSelectedOrgao(orgao)
      setOrgaoDetailsOpen(true)
    }
  }

  const handleOrgaoSelect = (orgao: OrgaoType) => {
    setSelectedOrgao(orgao)
    setOrgaoDetailsOpen(true)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Licitações</h1>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold truncate">{estatisticas.total}</div>
            <div className="text-sm text-muted-foreground">Licitações totais</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold truncate">{estatisticas.ativas}</div>
            <div className="text-sm text-muted-foreground">Licitações ativas</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold truncate">{estatisticas.vencidas}</div>
            <div className="text-sm text-muted-foreground">Licitações vencidas</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{formatarValorCompacto(estatisticas.valorTotal)}</div>
              <div className="text-sm text-muted-foreground">R$ total em licitações</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold truncate">{estatisticas.taxaSucesso}%</div>
            <div className="text-sm text-muted-foreground">Taxa de sucesso</div>
          </CardContent>
        </Card>
      </div>

      {/* Abas e Filtros */}
      <div className="flex flex-col gap-4">
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => setAbaAtiva("kanban")}
                variant={abaAtiva === "kanban" ? "default" : "outline"}
              >
                Kanban
              </Button>
              <Button
                size="sm"
                onClick={() => setAbaAtiva("lista")}
                variant={abaAtiva === "lista" ? "default" : "outline"}
              >
                Lista
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <FiltroLicitacoesOtimizado 
                onFilterChange={handleFilterChange}
                orgaos={orgaos}
                responsaveis={responsaveis}
                modalidades={modalidades}
              />
              <NovaLicitacao
                onLicitacaoAdded={handleLicitacaoAdded}
              />
            </div>
          </div>

          {/* Tabela de licitações */}
          <TabsContent value="lista" className="mt-4">
            <div className="rounded-md border shadow-sm">
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-50">
                    <tr>
                      <th className="p-4">Título</th>
                      <th className="p-4">Órgão</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Responsável</th>
                      <th className="p-4">Data de Abertura</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center">
                          Carregando licitações...
                        </td>
                      </tr>
                    ) : filteredLicitacoes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center">
                          Nenhuma licitação encontrada
                        </td>
                      </tr>
                    ) : (
                      filteredLicitacoes.map((licitacao) => (
                        <tr
                          key={licitacao.id}
                          className="border-b cursor-pointer hover:bg-gray-50"
                          onClick={() => handleLicitacaoClick(licitacao)}
                        >
                          <td className="p-4">{licitacao.titulo}</td>
                          <td className="p-4">
                            <Button
                              variant="link"
                              className="p-0 h-auto"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOrgaoClick(typeof licitacao.orgao === 'object' ? licitacao.orgao.nome : licitacao.orgao)
                              }}
                            >
                              {typeof licitacao.orgao === 'object' ? licitacao.orgao.nome : licitacao.orgao}
                            </Button>
                          </td>
                          <td className="p-4">{formatarValor(licitacao.valor_estimado)}</td>
                          <td className="p-4">{licitacao.responsavel || "Não definido"}</td>
                          <td className="p-4">{licitacao.data_abertura || licitacao.dataAbertura || "Não definido"}</td>
                          <td className="p-4">
                            <StatusBadge status={licitacao.status} />
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                  }}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleLicitacaoClick(licitacao)
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteLicitacao(licitacao)
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadEdital(licitacao)
                                  }}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Baixar Edital
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleShareLicitacao(licitacao)
                                  }}
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Compartilhar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSendEmail(licitacao)
                                  }}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Enviar Email
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleScheduleCall(licitacao)
                                  }}
                                >
                                  <Phone className="mr-2 h-4 w-4" />
                                  Agendar Ligação
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsWon(licitacao)
                                  }}
                                  disabled={licitacao.status === "vencida"}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Marcar como Ganho
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsLost(licitacao)
                                  }}
                                  disabled={licitacao.status === "nao_vencida"}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Marcar como Perdido
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Visualização Kanban */}
          <TabsContent value="kanban" className="mt-4">
            <div className="bg-white rounded-md border shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Kanban de Licitações</h2>
              <LicitacaoKanbanBoard
                licitacoes={filteredLicitacoes}
                onUpdateStatus={handleUpdateStatus}
                onLicitacaoClick={(licitacao) => handleLicitacaoClick(licitacao)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais de Detalhes */}
      {selectedLicitacao && detailsOpen ? (
        <DetalhesLicitacao
          key={`licitacao-${selectedLicitacao.id}`}
          licitacao={selectedLicitacao}
          open={detailsOpen}
          onOpenChange={(open) => {
            setDetailsOpen(open)
            if (!open) {
              setTimeout(() => {
                setSelectedLicitacao(null)
              }, 300)
            }
          }}
          onUpdateStatus={handleUpdateStatus}
          onOrgaoClick={handleOrgaoClick}
          onLicitacaoUpdate={handleLicitacaoUpdate}
          onLicitacaoDelete={handleDeleteLicitacao}
        />
      ) : null}

      {selectedOrgao && orgaoDetailsOpen ? (
        <DetalhesOrgao
          key={`orgao-${selectedOrgao.id}`}
          orgao={selectedOrgao}
          open={orgaoDetailsOpen}
          onOpenChange={(open) => {
            setOrgaoDetailsOpen(open)
            if (!open) {
              setTimeout(() => {
                setSelectedOrgao(null)
              }, 300)
            }
          }}
          onOrgaoUpdate={handleOrgaoUpdate}
          onOrgaoDelete={handleOrgaoDelete}
        />
      ) : null}
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta licitação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogExcluirAberto(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteLicitacao}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; class: string }> = {
    "Em andamento": { label: "Em andamento", class: "bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs" },
    "Encerrado": { label: "Encerrado", class: "bg-red-100 text-red-800 rounded-full px-3 py-1 text-xs" },
    "Aguardando documentação": { label: "Aguardando documentação", class: "bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-xs" },
    "Em análise": { label: "Em análise", class: "bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-xs" },
    "Publicado": { label: "Publicado", class: "bg-green-100 text-green-800 rounded-full px-3 py-1 text-xs" },
    "vencida": { label: "Vencida", class: "bg-green-100 text-green-800 rounded-full px-3 py-1 text-xs" },
    "nao_vencida": { label: "Não Vencida", class: "bg-red-100 text-red-800 rounded-full px-3 py-1 text-xs" }
  }

  const config = statusConfig[status] || {
    label: status,
    class: "bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-xs",
  }

  return <span className={config.class}>{config.label}</span>
}
