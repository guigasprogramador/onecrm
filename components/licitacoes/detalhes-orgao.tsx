"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, User, PlusCircle, Edit, Save, Trash2, ChevronRight, Landmark, AlertTriangle, Maximize2, Minimize2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { crmonefactory } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

interface StatusColors {
  ativo: string;
  inativo: string;
  pendente: string;
  analise_interna: string;
  aguardando_pregao: string;
  vencida: string;
  nao_vencida: string;
  envio_documentos: string;
  assinaturas: string;
  concluida: string;
}

interface StatusLabels {
  ativo: string;
  inativo: string;
  pendente: string;
  analise_interna: string;
  aguardando_pregao: string;
  vencida: string;
  nao_vencida: string;
  envio_documentos: string;
  assinaturas: string;
  concluida: string;
}

interface Orgao {
  id: string;
  nome: string;
  status: string;
  tipo?: string;
  tipoLabel?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  site?: string;
  segmento?: string;
  origemLead?: string;
  responsavelInterno?: string;
  descricao?: string;
  observacoes?: string;
  faturamento?: string;
  contatos?: Contato[];
}

interface Contato {
  id: string;
  orgao_id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
}

interface NovoContato {
  nome: string;
  email: string;
  telefone: string;
  cargo?: string;
  departamento?: string;
  observacoes?: string;
}

interface DetalhesOrgaoProps {
  orgao: Orgao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrgaoUpdate?: (orgao: Orgao) => void;
  onOrgaoDelete?: (orgao: Orgao) => void;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

type ToastVariant = "default" | "destructive";

interface ToastProps {
  title: string;
  description: string;
  variant?: ToastVariant;
}

interface ContatoFormData {
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
}

interface Contato {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  orgao_id: string;
  created_at?: string;
  updated_at?: string;
}

const statusColors: StatusColors = {
  ativo: "bg-green-100 text-green-800",
  inativo: "bg-red-100 text-red-800",
  pendente: "bg-yellow-100 text-yellow-800",
  analise_interna: "bg-yellow-100 text-yellow-800",
  aguardando_pregao: "bg-blue-100 text-blue-800",
  vencida: "bg-red-100 text-red-800",
  nao_vencida: "bg-green-100 text-green-800",
  envio_documentos: "bg-purple-100 text-purple-800",
  assinaturas: "bg-indigo-100 text-indigo-800",
  concluida: "bg-gray-100 text-gray-800"
};

const statusLabels: StatusLabels = {
  ativo: "Ativo",
  inativo: "Inativo",
  pendente: "Pendente",
  analise_interna: "Em Análise Interna",
  aguardando_pregao: "Aguardando Pregão",
  vencida: "Vencida",
  nao_vencida: "Não Vencida",
  envio_documentos: "Envio de Documentos",
  assinaturas: "Assinaturas",
  concluida: "Concluída"
};

const getStatusColor = (status: keyof StatusColors) => {
  return statusColors[status] || "bg-gray-100 text-gray-800";
};

const getStatusLabel = (status: keyof StatusLabels) => {
  return statusLabels[status] || "Status Desconhecido";
};

export function DetalhesOrgao({ orgao, open, onOpenChange, onOrgaoUpdate, onOrgaoDelete }: DetalhesOrgaoProps) {
  const [activeTab, setActiveTab] = useState("resumo")
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Orgao>>({})
  const [contatos, setContatos] = useState<Contato[]>([])
  const [novoContato, setNovoContato] = useState<Omit<Contato, 'id'>>({
    orgao_id: orgao?.id || '',
    nome: '',
    email: '',
    telefone: '',
    cargo: ''
  })
  const [mostrarFormContato, setMostrarFormContato] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editandoContato, setEditandoContato] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orgaoState, setOrgaoState] = useState<Orgao | null>(orgao)
  const [contatoEditando, setContatoEditando] = useState<Contato | null>(null)
  const [showAddContatoDialog, setShowAddContatoDialog] = useState(false)

  const { toast } = useToast()

  // Reset active tab when opening the sheet
  useEffect(() => {
    if (open) {
      setActiveTab("resumo")
      setIsEditing(false)
    }
  }, [open])

  // Dados fictícios para demonstração
  const orgaoDemo: Orgao = {
    id: "c8c1f06e-9ed5-4de5-9f47-a48eb5fb1c28",
    nome: "Prefeitura de São Paulo",
    status: "ativo",
    tipo: "prefeitura",
    tipoLabel: "Prefeitura Municipal",
    cnpj: "12.345.678/0001-90",
    endereco: "Viaduto do Chá, 15",
    cidade: "São Paulo",
    estado: "SP",
    segmento: "Administração Pública Municipal",
    origemLead: "Edital publicado - ComprasNet",
    responsavelInterno: "Ana Silva",
    descricao: "Prefeitura do município de São Paulo, maior cidade do Brasil.",
    observacoes: "Cliente exige documentação completa para licitações. Pagamentos em até 30 dias após empenho.",
    faturamento: "Empenho prévio necessário. Nota fiscal com ISS (5%). Contatos devem ser sempre formalizados por e-mail com cópia para departamento jurídico.",
    contatos: [
      {
        id: "c1",
        orgao_id: "c8c1f06e-9ed5-4de5-9f47-a48eb5fb1c28",
        nome: "João Oliveira",
        cargo: "Secretário de Tecnologia",
        email: "joao.oliveira@prefeiturasp.gov.br",
        telefone: "(11) 3333-4444",
      },
      {
        id: "c2",
        orgao_id: "c8c1f06e-9ed5-4de5-9f47-a48eb5fb1c28",
        nome: "Maria Santos",
        cargo: "Diretora de Compras",
        email: "maria.santos@prefeiturasp.gov.br",
        telefone: "(11) 3333-5555",
      },
    ],
  }

  // Licitações relacionadas a este órgão
  const licitacoesRelacionadas = [
    {
      id: "1",
      nome: "Pregão Eletrônico 123/2023",
      valor: "R$ 450.000,00",
      status: "analise_interna",
      prazo: "30/06/2023",
      responsavel: "Ana Silva",
      dataJulgamento: "15/07/2023",
    },
    {
      id: "2",
      nome: "Tomada de Preços 45/2022",
      valor: "R$ 320.000,00",
      status: "vencida",
      prazo: "Concluído",
      responsavel: "Carlos Oliveira",
      dataJulgamento: "10/11/2022",
    },
    {
      id: "3",
      nome: "Concorrência 78/2022",
      valor: "R$ 780.000,00",
      status: "nao_vencida",
      prazo: "Concluído",
      responsavel: "Pedro Santos",
      dataJulgamento: "22/08/2022",
    },
  ]

  useEffect(() => {
    // Initialize form with orgao data or demo data if orgao is null
    setFormData(orgao || orgaoDemo)
  }, [orgao])

  useEffect(() => {
    if (orgao?.id && open) {
      // Primeiro verifica se o órgão existe antes de carregar contatos
      verificarOrgaoExiste()
    }
  }, [orgao?.id, open])

  // Função para verificar se o órgão existe antes de carregar contatos
  const verificarOrgaoExiste = async () => {
    try {
      if (!orgao?.id) {
        console.log('ID do órgão não fornecido')
        return
      }

      console.log('Verificando se o órgão existe:', orgao.id)

      // Verifica no localStorage se já conhecemos que este é um órgão temporário
      const isTemporaryOrgao = sessionStorage.getItem(`temp_orgao_${orgao.id}`)
      if (isTemporaryOrgao === "true") {
        console.log('Este é um órgão temporário, pulando verificação na API')
        return
      }

      // Verifica se o órgão existe
      const { data: orgaoData, error: orgaoError } = await crmonefactory
        .from('orgaos')
        .select('id')
        .eq('id', orgao.id)
        .maybeSingle()

      if (orgaoError) {
        console.error('Erro ao verificar órgão:', orgaoError)
        return
      }

      if (!orgaoData) {
        console.log('Órgão não encontrado no banco, marcando como temporário')
        // Marca este órgão como temporário no sessionStorage para evitar futuras verificações
        sessionStorage.setItem(`temp_orgao_${orgao.id}`, "true")
        
        // Exibe mensagem informativa para o usuário
        toast({
          title: "Informação",
          description: "Este órgão ainda não está completamente cadastrado no sistema.",
        })
      } else {
        // Se o órgão existe, carrega seus contatos
        carregarContatos()
      }
    } catch (error) {
      console.error('Erro ao verificar órgão:', error)
    }
  }

  const carregarContatos = async () => {
    try {
      if (!orgao?.id) {
        console.log('ID do órgão não encontrado')
        return
      }

      // Verifica no localStorage se este é um órgão temporário
      const isTemporaryOrgao = sessionStorage.getItem(`temp_orgao_${orgao.id}`)
      if (isTemporaryOrgao === "true") {
        console.log('Este é um órgão temporário, não carregando contatos')
        return
      }

      console.log('Carregando contatos para o órgão:', orgao.id)

      // Carrega os contatos diretamente, pois já verificamos que o órgão existe
      const { data, error } = await crmonefactory
        .from('orgao_contatos')
        .select('*')
        .eq('orgao_id', orgao.id)
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar contatos:', error)
        throw error
      }

      console.log('Contatos carregados:', data)
      setContatos(data || [])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar contatos",
        variant: "destructive"
      })
    }
  }

  const adicionarContato = async (contato: Contato) => {
    try {
      const { error } = await crmonefactory
        .from('orgao_contatos')
        .insert(contato)
        .eq('id', contato.id)

      if (error) throw error

      setContatos(prev => [...prev, contato])
      toast({
        title: "Sucesso",
        description: "Contato adicionado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao adicionar contato:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar contato"
      })
    }
  }

  const excluirContato = async (contato: Contato) => {
    try {
      const { error } = await crmonefactory
        .from('orgao_contatos')
        .delete()
        .eq('id', contato.id)

      if (error) throw error

      setContatos(contatos.filter(c => c.id !== contato.id))
      toast({
        title: "Sucesso",
        description: "Contato excluído com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao excluir contato:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir contato"
      })
    }
  }

  const editarContato = async (contato: Contato) => {
    try {
      const { error } = await crmonefactory
        .from('orgao_contatos')
        .update({
          nome: contato.nome,
          cargo: contato.cargo || null,
          email: contato.email || null,
          telefone: contato.telefone || null
        })
        .eq('id', contato.id)

      if (error) throw error

      setContatos(contatos.map(c => c.id === contato.id ? contato : c))
      setEditandoContato(null)
      toast({
        title: "Sucesso",
        description: "Contato atualizado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao atualizar contato:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar contato. Tente novamente."
      })
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleContatoChange = (id: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contatos: prev.contatos?.map((contato) => 
        contato.id === id ? { ...contato, [field]: value } : contato
      ),
    }))
  }

  const handleSalvarOrgao = async () => {
    try {
      if (!orgao) return;

      const { error } = await crmonefactory
        .from('orgaos')
        .update({
          nome: orgao.nome,
          status: orgao.status,
          cnpj: orgao.cnpj,
          endereco: orgao.endereco,
          cidade: orgao.cidade,
          estado: orgao.estado,
          cep: orgao.cep,
          site: orgao.site,
          observacoes: orgao.observacoes
        })
        .eq('id', orgao.id)

      if (error) throw error

      if (onOrgaoUpdate) {
        onOrgaoUpdate(orgao)
      }

      toast({
        title: "Sucesso",
        description: "Órgão atualizado com sucesso",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao atualizar órgão:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar órgão",
        variant: "destructive"
      })
    }
  }

  const handleExcluirOrgao = async () => {
    try {
      if (!orgao) return;

      const { error } = await crmonefactory
        .from('orgaos')
        .delete()
        .eq('id', orgao.id)

      if (error) throw error

      if (onOrgaoDelete) {
        onOrgaoDelete(orgao)
      }

      toast({
        title: "Sucesso",
        description: "Órgão excluído com sucesso",
        variant: "default"
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao excluir órgão:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir órgão",
        variant: "destructive"
      })
    }
  }

  const handleAddContato = async (formData: ContatoFormData) => {
    try {
      if (!orgao?.id) {
        throw new Error('ID do órgão não encontrado')
      }

      console.log('ID do órgão:', orgao.id)

      // Verifica se o órgão existe na tabela orgaos
      const { data: orgaoData, error: orgaoError } = await crmonefactory
        .from('orgaos')
        .select('id')
        .eq('id', orgao.id)
        .maybeSingle()

      if (orgaoError) {
        console.error('Erro ao verificar órgão:', orgaoError)
        throw new Error(`Erro ao verificar órgão: ${orgaoError.message}`)
      }

      if (!orgaoData) {
        throw new Error(`Órgão com ID ${orgao.id} não encontrado na tabela orgaos`)
      }

      // Validação dos campos obrigatórios
      if (!formData.nome?.trim()) {
        throw new Error('Nome do contato é obrigatório')
      }

      const newContato = {
        id: uuidv4(),
        orgao_id: orgao.id,
        nome: formData.nome.trim(),
        cargo: formData.cargo?.trim() || null,
        email: formData.email?.trim() || null,
        telefone: formData.telefone?.trim() || null,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        licitacao_id: null
      }

      console.log('Tentando adicionar contato:', newContato)

      const { data, error } = await crmonefactory
        .from('orgao_contatos')
        .insert([newContato])
        .select()

      if (error) {
        console.error('Erro detalhado ao adicionar contato:', error)
        if (error.code === '23503') { // Código de erro para violação de chave estrangeira
          throw new Error(`Erro: O órgão com ID ${orgao.id} não existe na tabela orgaos`)
        }
        throw new Error(error.message || 'Erro ao adicionar contato')
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhum dado retornado após inserção')
      }

      console.log('Contato adicionado com sucesso:', data[0])

      setContatos(prev => [...prev, data[0]])
      setShowAddContatoDialog(false)
      toast({
        title: "Sucesso",
        description: "Contato adicionado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao adicionar contato:', error)
      let errorMessage = 'Erro ao adicionar contato'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleEditContato = async (contato: Contato) => {
    try {
      if (!orgao?.id) {
        throw new Error('ID do órgão não encontrado')
      }

      const updatedContato = {
        ...contato,
        orgao_id: orgao.id,
        data_atualizacao: new Date().toISOString()
      }

      console.log('Tentando atualizar contato:', updatedContato)

      const { data, error } = await crmonefactory
        .from('orgao_contatos')
        .update(updatedContato)
        .eq('id', contato.id)
        .select()

      if (error) {
        console.error('Erro detalhado ao atualizar contato:', error)
        throw new Error(error.message || 'Erro ao atualizar contato')
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhum dado retornado após atualização')
      }

      console.log('Contato atualizado com sucesso:', data[0])

      setContatos(prev => prev.map(c => c.id === contato.id ? data[0] : c))
      setContatoEditando(null)
      toast({
        title: "Sucesso",
        description: "Contato atualizado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao atualizar contato:', error)
      let errorMessage = 'Erro ao atualizar contato'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleDeleteContato = async (contato: Contato) => {
    try {
      console.log('Tentando excluir contato:', contato.id)

      const { error } = await crmonefactory
        .from('orgao_contatos')
        .delete()
        .eq('id', contato.id)

      if (error) {
        console.error('Erro detalhado ao excluir contato:', error)
        throw new Error(error.message || 'Erro ao excluir contato')
      }

      console.log('Contato excluído com sucesso')

      setContatos(prev => prev.filter(c => c.id !== contato.id))
      toast({
        title: "Sucesso",
        description: "Contato excluído com sucesso"
      })
    } catch (error) {
      console.error('Erro ao excluir contato:', error)
      let errorMessage = 'Erro ao excluir contato'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  if (!orgao) {
    return (
      <Sheet key="empty-orgao-sheet" open={false} onOpenChange={() => {}}>
        <SheetContent className="w-full md:max-w-xl lg:max-w-2xl overflow-y-auto">
          <div></div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este órgão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluirOrgao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet key={`orgao-sheet-${orgao?.id || "empty"}`} open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          className={`overflow-y-auto transition-all duration-300 ${
            isExpanded ? "w-[95vw] max-w-[95vw]" : "w-full md:max-w-3xl lg:max-w-4xl"
          }`}
        >
          <SheetHeader className="mb-6">
            <div className="flex justify-between items-center">
              <SheetTitle className="text-xl flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                {isEditing ? (
                  <Input 
                    value={formData.nome || ""} 
                    onChange={(e) => handleFieldChange("nome", e.target.value)}
                    className="h-7 text-xl font-semibold"
                  />
                ) : (
                  formData.nome || "Órgão"
                )}
              </SheetTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 rounded-full"
                  title={isExpanded ? "Recolher painel" : "Expandir painel"}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                ) : (
                  <Button onClick={handleSalvarOrgao} variant="outline" size="sm" className="gap-2">
                    <Save className="w-4 h-4" />
                    Salvar
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="resumo" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="contatos">Contatos</TabsTrigger>
              <TabsTrigger value="licitacoes">Licitações</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>CNPJ</Label>
                        {isEditing ? (
                          <Input value={formData.cnpj} onChange={(e) => handleFieldChange("cnpj", e.target.value)} />
                        ) : (
                          <p className="text-sm mt-1">{formData.cnpj}</p>
                        )}
                      </div>

                      <div>
                        <Label>Endereço</Label>
                        {isEditing ? (
                          <Input
                            value={formData.endereco}
                            onChange={(e) => handleFieldChange("endereco", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{formData.endereco}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Cidade</Label>
                          {isEditing ? (
                            <Input
                              value={formData.cidade}
                              onChange={(e) => handleFieldChange("cidade", e.target.value)}
                            />
                          ) : (
                            <p className="text-sm mt-1">{formData.cidade}</p>
                          )}
                        </div>
                        <div>
                          <Label>Estado</Label>
                          {isEditing ? (
                            <Input
                              value={formData.estado}
                              onChange={(e) => handleFieldChange("estado", e.target.value)}
                            />
                          ) : (
                            <p className="text-sm mt-1">{formData.estado}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Segmento</Label>
                        {isEditing ? (
                          <Input
                            value={formData.segmento}
                            onChange={(e) => handleFieldChange("segmento", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{formData.segmento}</p>
                        )}
                      </div>

                      <div>
                        <Label>Origem da Lead</Label>
                        {isEditing ? (
                          <Input
                            value={formData.origemLead}
                            onChange={(e) => handleFieldChange("origemLead", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{formData.origemLead}</p>
                        )}
                      </div>

                      <div>
                        <Label>Responsável Interno</Label>
                        {isEditing ? (
                          <Input
                            value={formData.responsavelInterno}
                            onChange={(e) => handleFieldChange("responsavelInterno", e.target.value)}
                          />
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{formData.responsavelInterno}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Descrição</Label>
                  {isEditing ? (
                    <Textarea
                      className="mt-2"
                      value={formData.descricao}
                      onChange={(e) => handleFieldChange("descricao", e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.descricao}</p>
                  )}
                </div>

                <div>
                  <Label>Observações</Label>
                  {isEditing ? (
                    <Textarea
                      className="mt-2"
                      value={formData.observacoes}
                      onChange={(e) => handleFieldChange("observacoes", e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm mt-1">{formData.observacoes}</p>
                  )}
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-base font-medium mb-2">Informações para Faturamento</h3>
                    {isEditing ? (
                      <Textarea
                        value={formData.faturamento}
                        onChange={(e) => handleFieldChange("faturamento", e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm">{formData.faturamento}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contatos">
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Contatos</h3>
                  {!mostrarFormContato && (
                    <Button size="sm" onClick={() => setMostrarFormContato(true)} className="gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Adicionar Contato
                    </Button>
                  )}
                </div>

                {mostrarFormContato && (
                  <Card className="mb-6">
                    <CardContent className="p-4">
                      <h3 className="text-base font-medium mb-4">Novo Contato</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="nome-contato">Nome</Label>
                          <Input
                            id="nome-contato"
                            value={novoContato.nome}
                            onChange={(e) => setNovoContato({ ...novoContato, nome: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cargo-contato">Cargo</Label>
                          <Input
                            id="cargo-contato"
                            value={novoContato.cargo}
                            onChange={(e) => setNovoContato({ ...novoContato, cargo: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email-contato">Email</Label>
                          <Input
                            id="email-contato"
                            type="email"
                            value={novoContato.email}
                            onChange={(e) => setNovoContato({ ...novoContato, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone-contato">Telefone</Label>
                          <Input
                            id="telefone-contato"
                            value={novoContato.telefone}
                            onChange={(e) => setNovoContato({ ...novoContato, telefone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setMostrarFormContato(false)}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleAddContato(novoContato)} disabled={!novoContato.nome || !novoContato.email}>
                          Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    contatos.map((contato) => (
                      <Card key={contato.id}>
                        <CardContent className="p-4">
                          {editandoContato === contato.id ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                      <Label>Nome</Label>
                                      <Input 
                                        value={contato.nome} 
                                    onChange={(e) => handleContatoChange(contato.id, 'nome', e.target.value)}
                                      />
                                    </div>
                                <div className="space-y-2">
                                      <Label>Cargo</Label>
                                      <Input 
                                    value={contato.cargo}
                                    onChange={(e) => handleContatoChange(contato.id, 'cargo', e.target.value)}
                                      />
                                    </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                      <Label>Email</Label>
                                      <Input 
                                        value={contato.email} 
                                    onChange={(e) => handleContatoChange(contato.id, 'email', e.target.value)}
                                      />
                                    </div>
                                <div className="space-y-2">
                                      <Label>Telefone</Label>
                                      <Input 
                                    value={contato.telefone}
                                    onChange={(e) => handleContatoChange(contato.id, 'telefone', e.target.value)}
                                      />
                                    </div>
                                  </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditandoContato(null)}
                                >
                                      Cancelar
                                    </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleEditContato(contato)}
                                >
                                      Salvar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="font-medium">{contato.nome}</div>
                                {contato.cargo && <div className="text-sm text-gray-500">{contato.cargo}</div>}
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  {contato.email && (
                                    <div className="flex items-center">
                                      <Mail className="w-4 h-4 mr-1" />
                                        {contato.email}
                                    </div>
                                  )}
                                  {contato.telefone && (
                                    <div className="flex items-center">
                                      <Phone className="w-4 h-4 mr-1" />
                                        {contato.telefone}
                                    </div>
                              )}
                            </div>
                              </div>
                              <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                  size="sm"
                                  onClick={() => setEditandoContato(contato.id)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteContato(contato)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                            </div>
                          </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="licitacoes">
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Licitações</h3>

                <div className="space-y-4">
                  {licitacoesRelacionadas.map((licitacao) => (
                    <Card key={licitacao.id} className="overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b">
                        <div>
                          <h4 className="font-medium">{licitacao.nome}</h4>
                          <p className="text-sm text-gray-500">
                            Responsável: {licitacao.responsavel} • Julgamento: {licitacao.dataJulgamento}
                          </p>
                        </div>
                        <Badge className={getStatusColor(licitacao.status as keyof StatusColors)}>
                          {getStatusLabel(licitacao.status as keyof StatusLabels)}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold">{licitacao.valor}</div>
                          <Button size="sm" variant="outline" className="gap-1">
                            Ver detalhes
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {licitacoesRelacionadas.length === 0 && (
                    <div className="text-center py-8 text-gray-500">Nenhuma licitação encontrada para este órgão</div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
}
