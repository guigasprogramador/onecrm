"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, FileText, Trash2, Calendar } from "lucide-react"
import { NovoDocumento } from "@/components/documentos/novo-documento"
import { VisualizadorDocumento } from "@/components/documentos/visualizador-documento"
import { FiltroDocumentos, DocumentoFiltros } from "@/components/documentos/filtro-documentos"
import { useDocuments, DocumentType } from "@/hooks/useDocuments"
import { format, addDays, isAfter, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"

// Interface atualizada para usar os tipos da API
interface Documento {
  id: string;
  nome: string;
  tipo: string;
  formato: string;
  categoria: string;
  categoriaId?: string;
  licitacao?: string;
  licitacaoId?: string;
  licitacao_id?: string;
  dataUpload?: string;
  uploadPor?: string;
  resumo?: string;
  url?: string;
  arquivo_path?: string;
  tamanho?: string | number;
  dataValidade?: string;
}

// Dados de exemplo para backup caso a API falhe
const documentosData: Documento[] = [
  {
    id: "1",
    nome: "Edital_Pregao_123.pdf",
    tipo: "Edital",
    formato: "pdf",
    categoria: "Jurídicos",
    categoriaId: "juridicos",
    licitacao: "Pregão Eletrônico 123/2023",
    licitacaoId: "pregao_123",
    dataUpload: "10/01/2023",
    tamanho: "2.5 MB",
    uploadPor: "Ana Silva",
    resumo: "Edital completo do Pregão Eletrônico 123/2023 para aquisição de software de gestão municipal.",
  },
  {
    id: "2",
    nome: "Proposta_Comercial.docx",
    tipo: "Proposta",
    formato: "docx",
    categoria: "Projetos",
    categoriaId: "projetos",
    licitacao: "Concorrência 45/2023",
    licitacaoId: "concorrencia_45",
    dataUpload: "15/01/2023",
    tamanho: "1.8 MB",
    uploadPor: "Carlos Oliveira",
    resumo: "Proposta comercial detalhada para a Concorrência 45/2023, incluindo valores, prazos e condições.",
  },
  {
    id: "3",
    nome: "Certidao_Negativa.pdf",
    tipo: "Certidão",
    formato: "pdf",
    categoria: "Contábeis",
    categoriaId: "contabeis",
    licitacao: "Tomada de Preços 78/2023",
    licitacaoId: "tomada_78",
    dataUpload: "20/01/2023",
    tamanho: "0.5 MB",
    uploadPor: "Maria Souza",
    resumo: "Certidão negativa de débitos municipais válida até 20/07/2023.",
  },
  {
    id: "4",
    nome: "Contrato_Assinado.pdf",
    tipo: "Contrato",
    formato: "pdf",
    categoria: "Jurídicos",
    categoriaId: "juridicos",
    licitacao: "Pregão Presencial 56/2023",
    licitacaoId: "pregao_56",
    dataUpload: "25/01/2023",
    tamanho: "3.2 MB",
    uploadPor: "Pedro Santos",
    resumo: "Contrato assinado referente ao Pregão Presencial 56/2023 com vigência de 12 meses.",
  },
  {
    id: "5",
    nome: "Planilha_Orcamentaria.xlsx",
    tipo: "Planilha",
    formato: "xlsx",
    categoria: "Contábeis",
    categoriaId: "contabeis",
    licitacao: "Concorrência 92/2023",
    licitacaoId: "concorrencia_92",
    dataUpload: "30/01/2023",
    tamanho: "1.1 MB",
    uploadPor: "Ana Silva",
    resumo: "Planilha orçamentária detalhada com todos os itens e valores para a Concorrência 92/2023.",
  },
  {
    id: "6",
    nome: "Estatuto_Social.pdf",
    tipo: "Documento Legal",
    formato: "pdf",
    categoria: "Jurídicos",
    categoriaId: "juridicos",
    licitacao: "Pregão Eletrônico 123/2023",
    licitacaoId: "pregao_123",
    dataUpload: "05/02/2023",
    tamanho: "1.7 MB",
    uploadPor: "Carlos Oliveira",
    resumo: "Estatuto social da empresa atualizado conforme última assembleia.",
  },
  {
    id: "7",
    nome: "Apresentacao_Projeto.pptx",
    tipo: "Apresentação",
    formato: "pptx",
    categoria: "Projetos",
    categoriaId: "projetos",
    licitacao: "Tomada de Preços 78/2023",
    licitacaoId: "tomada_78",
    dataUpload: "10/02/2023",
    tamanho: "4.3 MB",
    uploadPor: "Maria Souza",
    resumo: "Apresentação detalhada do projeto técnico para a Tomada de Preços 78/2023.",
  },
  {
    id: "8",
    nome: "Relatorio_Tecnico.pdf",
    tipo: "Relatório",
    formato: "pdf",
    categoria: "Técnicos",
    categoriaId: "tecnicos",
    licitacao: "Concorrência 45/2023",
    licitacaoId: "concorrencia_45",
    dataUpload: "15/02/2023",
    tamanho: "2.8 MB",
    uploadPor: "Pedro Santos",
    resumo: "Relatório técnico detalhado sobre a solução proposta para a Concorrência 45/2023.",
  },
]

// Função para obter a classe CSS para o badge de categoria
function getCategoryBadgeClass(categoriaId: string): string {
  const classes: Record<string, string> = {
    projetos: "bg-blue-50 border-blue-200 text-blue-700",
    contabeis: "bg-green-50 border-green-200 text-green-700",
    societarios: "bg-purple-50 border-purple-200 text-purple-700",
    juridicos: "bg-amber-50 border-amber-200 text-amber-700",
    tecnicos: "bg-indigo-50 border-indigo-200 text-indigo-700",
    atestado_capacidade: "bg-red-50 border-red-200 text-red-700",
  }

  return classes[categoriaId] || "bg-gray-50 border-gray-200 text-gray-700"
}

export default function DocumentosPage() {
  const [filteredDocumentos, setFilteredDocumentos] = useState<Documento[]>([])
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const { toast } = useToast()
  
  // Hooks para carregar documentos da API
  const {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument
  } = useDocuments()

  // Efeito para carregar documentos ao montar o componente
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Efeito para atualizar documentos filtrados quando a lista de documentos mudar
  useEffect(() => {
    if (documents && documents.length > 0) {
      const formattedDocs = documents.map(formatarDocumentoParaUI)
      setFilteredDocumentos(formattedDocs)
    } else {
      // Fallback para dados de exemplo
      setFilteredDocumentos(documentosData)
    }
  }, [documents])

  // Função para formatar documento da API para o formato da UI
  const formatarDocumentoParaUI = (doc: DocumentType): Documento => {
    // Formatar data ISO para data legível
    let dataFormatada = ""
    if (doc.created_at) {
      try {
        dataFormatada = format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })
      } catch (e) {
        console.error("Erro ao formatar data:", e)
        dataFormatada = doc.created_at.toString()
      }
    }

    // Formatar tamanho do arquivo
    const tamanhoFormatado = doc.tamanho ? formatFileSize(doc.tamanho) : ""

    // Converter licitacao_id para licitacaoId para compatibilidade
    const licitacaoId = doc.licitacao_id || ""

    return {
      id: doc.id,
      nome: doc.nome || "",
      tipo: doc.tipo || "",
      formato: doc.formato || "",
      categoria: doc.categoria || "",
      categoriaId: doc.categoria_id || "",
      licitacao: doc.licitacao_nome || "",
      licitacaoId: licitacaoId,
      licitacao_id: doc.licitacao_id,
      dataUpload: dataFormatada,
      uploadPor: doc.uploaded_by || "",
      resumo: doc.descricao || "",
      arquivo_path: doc.arquivo_path,
      tamanho: tamanhoFormatado,
      dataValidade: doc.data_validade ? format(new Date(doc.data_validade), "dd/MM/yyyy", { locale: ptBR }) : undefined,
    }
  }

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Função para filtrar documentos
  const filtrarDocumentos = (filtros: DocumentoFiltros) => {
    let docsAtivos = [...documents.map(formatarDocumentoParaUI)]
    
    if (filtros.tipo) {
      docsAtivos = docsAtivos.filter(doc => doc.tipo === filtros.tipo)
    }
    
    if (filtros.categoria) {
      docsAtivos = docsAtivos.filter(doc => doc.categoriaId === filtros.categoria)
    }
    
    if (filtros.licitacao) {
      docsAtivos = docsAtivos.filter(doc => doc.licitacaoId === filtros.licitacao)
    }
    
    setFilteredDocumentos(docsAtivos)
  }

  // Função para abrir o visualizador de documento
  const handleViewDocument = (documento: Documento) => {
    // Sempre usar o visualizador em modal
    setSelectedDocumento(documento);
    setIsViewerOpen(true);
  }

  // Função para tratar o novo documento adicionado
  const handleDocumentoAdded = async (novoDocumento: any, arquivo?: File) => {
    try {
      const docData = {
        nome: novoDocumento.nome,
        tipo: novoDocumento.tipo,
        categoria: novoDocumento.categoria,
        descricao: novoDocumento.descricao,
        licitacaoId: novoDocumento.licitacaoId,
        numeroDocumento: novoDocumento.numeroDocumento,
        dataValidade: novoDocumento.dataValidade,
        urlDocumento: novoDocumento.urlDocumento,
        arquivo: arquivo
      }

      // Enviar documento para a API
      const resultado = await uploadDocument(docData)
      
      if (resultado) {
        toast({
          title: "Documento adicionado",
          description: "O documento foi adicionado com sucesso!"
        })
        
        // Recarregar a lista de documentos
        fetchDocuments()
      }
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar documento",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Função para lidar com a exclusão do documento
  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (window.confirm("Tem certeza que deseja excluir este documento?")) {
      try {
        const resultado = await deleteDocument(id)
        
        if (resultado) {
          toast({
            title: "Documento excluído",
            description: "O documento foi excluído com sucesso!"
          })
          
          // Recarregar a lista de documentos
          fetchDocuments()
        }
      } catch (error: any) {
        toast({
          title: "Erro ao excluir documento",
          description: error.message,
          variant: "destructive"
        })
      }
    }
  }

  // Função para fazer download do arquivo
  const handleDownload = (documento: Documento, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const downloadUrl = documento.url || 
      (documento.arquivo_path ? 
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos/${documento.arquivo_path}` : 
        null)
    
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    } else {
      toast({
        title: "Erro ao baixar documento",
        description: "URL do documento não encontrada.",
        variant: "destructive"
      })
    }
  }

  // Calcular estatísticas para os cards no topo
  const totalDocumentos = filteredDocumentos.length;
  
  // Calcular documentos que vencem em 30 dias
  const calcularDocumentosVencendo = () => {
    const hoje = new Date();
    const em30Dias = addDays(hoje, 30);
    
    return filteredDocumentos.filter(doc => {
      if (!doc.dataValidade) return false;
      
      try {
        const dataValidade = doc.dataValidade.split('/').reverse().join('-');
        const dataValidadeObj = new Date(dataValidade);
        
        // Documentos que vencem nos próximos 30 dias (depois de hoje e antes de 30 dias a partir de hoje)
        return isAfter(dataValidadeObj, hoje) && isBefore(dataValidadeObj, em30Dias);
      } catch (e) {
        return false;
      }
    }).length;
  };
  
  const documentosVencendo = calcularDocumentosVencendo();

  // Extrair listas de valores únicos para os filtros de forma mais simples
  const tiposUnicos = filteredDocumentos
    .map(doc => doc.tipo)
    .filter((value, index, self) => value && self.indexOf(value) === index);
  
  // Formatar corretamente as licitações e categorias conforme esperado pelos componentes
  const licitacoesUnicas = filteredDocumentos
    .filter(doc => doc.licitacaoId && doc.licitacao)
    .map(doc => ({ id: doc.licitacaoId || '', nome: doc.licitacao || 'Sem nome' }))
    .filter((value, index, self) => 
      index === self.findIndex(t => t.id === value.id)
    );
  
  const categoriasUnicas = filteredDocumentos
    .filter(doc => doc.categoria)
    .map(doc => ({ 
      id: doc.categoriaId || (doc.categoria ? doc.categoria.toLowerCase().replace(/\s+/g, '_') : ''), 
      nome: doc.categoria 
    }))
    .filter((value, index, self) => 
      index === self.findIndex(t => t.id === value.id)
    );

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-8">Documentos</h1>
      
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{totalDocumentos}</h2>
              <p className="text-sm text-muted-foreground">Documentos</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{documentosVencendo}</h2>
              <p className="text-sm text-muted-foreground">Vencem em 30dias</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Lista de Documentos</h2>
            <div className="flex items-center gap-2">
              <FiltroDocumentos 
                onFilterChange={filtrarDocumentos}
                tiposDocumentos={tiposUnicos}
                categorias={categoriasUnicas}
                licitacoes={licitacoesUnicas}
              />
              <NovoDocumento
                onDocumentoAdded={handleDocumentoAdded}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Gerenciamento de todos os documentos cadastrados</p>

          {/* Lista de documentos */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-primary rounded-full" 
                     aria-label="loading"></div>
                <p className="mt-2">Carregando documentos...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30 text-sm">
                    <th className="text-left p-3 font-medium">Nome</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Categoria</th>
                    <th className="text-left p-3 font-medium">Licitação</th>
                    <th className="text-left p-3 font-medium">Data de Upload</th>
                    <th className="text-left p-3 font-medium">Tamanho</th>
                    <th className="text-left p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocumentos.length > 0 ? (
                    filteredDocumentos.map((documento) => (
                      <tr
                        key={documento.id}
                        className="border-b hover:bg-gray-50 cursor-pointer text-sm"
                        onClick={() => handleViewDocument(documento)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            {documento.nome}
                          </div>
                        </td>
                        <td className="p-3">{documento.tipo}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={getCategoryBadgeClass(documento.categoriaId)}>
                            {documento.categoria}
                          </Badge>
                        </td>
                        <td className="p-3">{documento.licitacao}</td>
                        <td className="p-3">{documento.dataUpload}</td>
                        <td className="p-3">{documento.tamanho}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDocument(documento)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={(e) => handleDownload(documento, e)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-500 hover:text-red-700" 
                              onClick={(e) => handleDeleteDocument(documento.id, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        Nenhum documento encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Visualizador de documento */}
      <VisualizadorDocumento documento={selectedDocumento} open={isViewerOpen} onOpenChange={setIsViewerOpen} />
    </div>
  )
}
