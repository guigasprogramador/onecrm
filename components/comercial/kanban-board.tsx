"use client"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Badge } from "@/components/ui/badge"

interface Oportunidade {
  id: string
  titulo: string
  cliente: string
  valor: string
  responsavel: string
  prazo: string
  status: string
}

interface KanbanBoardProps {
  oportunidades: Oportunidade[]
  onUpdateStatus: (id: string, newStatus: string) => void
  onClienteClick?: (clienteId: string) => void
}

const columns = [
  { id: "novo_lead", title: "Novo Lead" },
  { id: "agendamento_reuniao", title: "Agendamento de Reunião" },
  { id: "levantamento_oportunidades", title: "Levantamento de Oportunidades" },
  { id: "proposta_enviada", title: "Proposta Enviada" },
  { id: "negociacao", title: "Negociação" },
  { id: "fechado_ganho", title: "Fechado (Ganho)" },
  { id: "fechado_perdido", title: "Fechado (Perdido)" },
]

export function KanbanBoard({ oportunidades, onUpdateStatus, onClienteClick }: KanbanBoardProps) {
  // Função para obter oportunidades por status
  const getOportunidadesByStatus = (status: string) => {
    return oportunidades.filter((op) => op.status === status)
  }

  // Função para lidar com o fim do arrasto
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result

    // Se não houver destino ou o destino for o mesmo que a origem, não fazer nada
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Atualizar o status da oportunidade
    onUpdateStatus(draggableId, destination.droppableId)
  }

  // Função para obter a classe CSS para o badge de status
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "novo_lead":
        return "bg-blue-100 text-blue-800"
      case "agendamento_reuniao":
        return "bg-purple-100 text-purple-800"
      case "levantamento_oportunidades":
        return "bg-indigo-100 text-indigo-800"
      case "proposta_enviada":
        return "bg-yellow-100 text-yellow-800"
      case "negociacao":
        return "bg-orange-100 text-orange-800"
      case "fechado_ganho":
        return "bg-green-100 text-green-800"
      case "fechado_perdido":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
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
                    {getOportunidadesByStatus(column.id).length}
                  </span>
                </h3>
                <div className="min-h-[calc(100vh-250px)] rounded-md">
                  {getOportunidadesByStatus(column.id).map((oportunidade, index) => (
                    <Draggable key={oportunidade.id} draggableId={oportunidade.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 mb-2 rounded-md ${
                            snapshot.isDragging ? "bg-blue-100 shadow-lg" : "bg-white"
                          } border shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300`}
                        >
                          <h4 className="font-medium text-sm mb-1 break-words line-clamp-2" title={oportunidade.titulo}>
                            {oportunidade.titulo}
                          </h4>
                          <p className="text-xs text-gray-500 mb-1 truncate" title={oportunidade.cliente}>
                            {onClienteClick ? (
                              <button 
                                className="text-blue-600 hover:underline focus:outline-none"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClienteClick(oportunidade.cliente);
                                }}
                              >
                                {oportunidade.cliente}
                              </button>
                            ) : (
                              oportunidade.cliente
                            )}
                          </p>
                          <div className="flex justify-between items-center flex-wrap gap-1">
                            <span className="text-xs font-semibold">{oportunidade.valor}</span>
                            <span className="text-xs text-gray-500">{oportunidade.prazo}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className="text-xs text-gray-500 truncate max-w-[60%]"
                              title={oportunidade.responsavel}
                            >
                              {oportunidade.responsavel}
                            </span>
                            <Badge className={`text-xs ${getStatusBadgeClass(oportunidade.status)}`}>
                              {getStatusLabel(oportunidade.status)}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {getOportunidadesByStatus(column.id).length === 0 && (
                    <div className="text-center py-4 text-sm text-gray-400">Arraste itens para cá</div>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}

// Função para obter o rótulo do status
function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    novo_lead: "Novo Lead",
    agendamento_reuniao: "Agendamento",
    levantamento_oportunidades: "Levantamento",
    proposta_enviada: "Proposta",
    negociacao: "Negociação",
    fechado_ganho: "Ganho",
    fechado_perdido: "Perdido",
  }
  return statusLabels[status] || status
}

