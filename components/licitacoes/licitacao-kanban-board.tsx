"use client"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Licitacao } from "./detalhes-licitacao"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Toggle } from "@/components/ui/toggle"
import { FormularioSimplificadoLicitacao } from "./formulario-simplificado-licitacao"
import { PlusCircle, FileText, FileTextIcon } from "lucide-react"

interface LicitacaoKanbanBoardProps {
  licitacoes: Licitacao[]
  onUpdateStatus: (id: string, newStatus: string) => void
  onLicitacaoClick?: (licitacao: Licitacao) => void
}

// Definição das colunas do Kanban
const columns = [
  { id: "analise_interna", title: "Análise Interna" },
  { id: "analise_edital", title: "Análise de Edital" },
  { id: "aguardando_pregao", title: "Aguardando Pregão" },
  { id: "em_andamento", title: "Em Andamento" },
  { id: "envio_documentos", title: "Envio de Documentos" },
  { id: "assinaturas", title: "Assinaturas" },
  { id: "vencida", title: "Vencida" },
  { id: "nao_vencida", title: "Não Vencida" }
]

export function LicitacaoKanbanBoard({ licitacoes, onUpdateStatus, onLicitacaoClick }: LicitacaoKanbanBoardProps) {
  const [showSimplifiedForm, setShowSimplifiedForm] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Função para obter licitações por status
  const getLicitacoesByStatus = (status: string) => {
    return licitacoes.filter((lic) => lic.status === status)
  }

  // Função para lidar com o fim do arrasto
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result

    // Se não houver destino ou o destino for o mesmo que a origem, não fazer nada
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Atualizar o status da licitação
    onUpdateStatus(draggableId, destination.droppableId)
  }

  // Função para obter a classe CSS para o badge de status
  const getStatusBadgeClass = (status: string): string => {
    const statusColors: Record<string, string> = {
      "analise_interna": "bg-purple-100 text-purple-800",
      "analise_edital": "bg-indigo-100 text-indigo-800",
      "aguardando_pregao": "bg-yellow-100 text-yellow-800",
      "em_andamento": "bg-blue-100 text-blue-800",
      "envio_documentos": "bg-amber-100 text-amber-800",
      "assinaturas": "bg-blue-100 text-blue-800",
      "vencida": "bg-green-100 text-green-800",
      "nao_vencida": "bg-red-100 text-red-800"
    }
    return statusColors[status] || "bg-gray-100 text-gray-800"
  }

  // Função para formatar valor
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return 'R$ 0,00'
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Licitações</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Toggle
              pressed={showSimplifiedForm}
              onPressedChange={setShowSimplifiedForm}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {showSimplifiedForm ? (
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4" />
                  <span>Simplificado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Completo</span>
                </div>
              )}
            </Toggle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Nova Licitação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {showSimplifiedForm ? "Nova Licitação (Simplificado)" : "Nova Licitação"}
                </DialogTitle>
              </DialogHeader>
              {showSimplifiedForm ? (
                <FormularioSimplificadoLicitacao
                  onClose={() => setIsDialogOpen(false)}
                  onSuccess={() => {
                    // Atualizar a lista de licitações
                    if (onLicitacaoClick) {
                      onLicitacaoClick({} as Licitacao)
                    }
                  }}
                />
              ) : (
                // Aqui você pode manter o formulário complexo existente
                <div>Formulário Complexo</div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex overflow-x-auto pb-6 gap-4">
          {columns.map((column) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-[280px] min-w-[280px] bg-gray-50 rounded-md p-2 ${
                    snapshot.isDraggingOver ? "bg-blue-50" : ""
                  }`}
                >
                  <h3 className="text-sm font-medium mb-2 px-2 py-1 truncate" title={column.title}>
                    {column.title}
                    <span className="ml-2 text-xs bg-white px-1.5 py-0.5 rounded-full">
                      {getLicitacoesByStatus(column.id).length}
                    </span>
                  </h3>
                  <div className="min-h-[calc(100vh-250px)] rounded-md">
                    {getLicitacoesByStatus(column.id).map((licitacao, index) => (
                      <Draggable key={licitacao.id} draggableId={licitacao.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 mb-2 rounded-md ${
                              snapshot.isDragging ? "bg-blue-100 shadow-lg" : "bg-white"
                            } border shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300`}
                            onClick={() => onLicitacaoClick && onLicitacaoClick(licitacao)}
                          >
                            <h4 className="font-medium text-sm mb-1 break-words line-clamp-2" title={licitacao.titulo}>
                              {licitacao.titulo}
                            </h4>
                            <p className="text-xs text-gray-500 mb-1 truncate" title={licitacao.orgao}>
                              {licitacao.orgao}
                            </p>
                            <div className="flex justify-between items-center flex-wrap gap-1">
                              <span className="text-xs font-semibold">{formatCurrency(licitacao.valorEstimado)}</span>
                              <span className="text-xs text-blue-500">{licitacao.dataAbertura}</span>
                            </div>
                            {licitacao.documentos && (
                              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                <span>Docs: {licitacao.documentos.length}</span>
                                <span>Resp: {licitacao.responsavel}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {getLicitacoesByStatus(column.id).length === 0 && (
                      <div className="text-center py-4 text-sm text-gray-400">Arraste itens para cá</div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
