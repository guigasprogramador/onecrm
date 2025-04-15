"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Filter, X, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface FiltroDocumentosProps {
  onFilterChange: (filters: DocumentoFiltros) => void
  tiposDocumentos: string[]
  categorias: { id: string; nome: string }[]
  licitacoes: { id: string; nome: string }[]
}

export interface DocumentoFiltros {
  termo: string
  tipo: string
  categoria: string
  licitacao: string
  dataInicio: Date | undefined
  dataFim: Date | undefined
  formato: string
}

export function FiltroDocumentos({ onFilterChange, tiposDocumentos, categorias, licitacoes }: FiltroDocumentosProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filtros, setFiltros] = useState<DocumentoFiltros>({
    termo: "",
    tipo: "todos",
    categoria: "todos",
    licitacao: "todos",
    dataInicio: undefined,
    dataFim: undefined,
    formato: "todos"
  })

  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Formatos de arquivo comuns
  const formatos = ["pdf", "docx", "xlsx", "pptx", "jpg", "png", "txt"]

  // Atualiza o contador de filtros ativos
  useEffect(() => {
    let count = 0
    if (filtros.termo) count++
    if (filtros.tipo !== "todos") count++
    if (filtros.categoria !== "todos") count++
    if (filtros.licitacao !== "todos") count++
    if (filtros.dataInicio) count++
    if (filtros.dataFim) count++
    if (filtros.formato !== "todos") count++
    
    setActiveFiltersCount(count)
  }, [filtros])

  // Atualiza os filtros e notifica o componente pai
  const handleFilterChange = (field: keyof DocumentoFiltros, value: any) => {
    const novosFiltros = { ...filtros, [field]: value }
    setFiltros(novosFiltros)
  }

  // Aplica os filtros
  const aplicarFiltros = () => {
    onFilterChange(filtros)
    setIsOpen(false)
  }

  // Limpa todos os filtros
  const limparFiltros = () => {
    const filtrosLimpos: DocumentoFiltros = {
      termo: "",
      tipo: "todos",
      categoria: "todos",
      licitacao: "todos",
      dataInicio: undefined,
      dataFim: undefined,
      formato: "todos"
    }
    setFiltros(filtrosLimpos)
    onFilterChange(filtrosLimpos)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-white">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros de Documentos</SheetTitle>
          <SheetDescription>
            Utilize os filtros abaixo para refinar sua busca de documentos.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Busca por termo */}
          <div className="space-y-2">
            <Label htmlFor="termo">Busca por termo</Label>
            <Input
              id="termo"
              placeholder="Buscar por nome ou conteúdo"
              value={filtros.termo}
              onChange={(e) => handleFilterChange("termo", e.target.value)}
            />
          </div>

          {/* Tipo de documento */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de documento</Label>
            <Select
              value={filtros.tipo}
              onValueChange={(value) => handleFilterChange("tipo", value)}
            >
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="todos-tipos" value="todos">Todos os tipos</SelectItem>
                {tiposDocumentos.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={filtros.categoria}
              onValueChange={(value) => handleFilterChange("categoria", value)}
            >
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="todas-categorias" value="todos">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Licitação */}
          <div className="space-y-2">
            <Label htmlFor="licitacao">Licitação</Label>
            <Select
              value={filtros.licitacao}
              onValueChange={(value) => handleFilterChange("licitacao", value)}
            >
              <SelectTrigger id="licitacao">
                <SelectValue placeholder="Selecione uma licitação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="todas-licitacoes" value="todos">Todas as licitações</SelectItem>
                {licitacoes.map((licitacao) => (
                  <SelectItem key={licitacao.id} value={licitacao.id}>
                    {licitacao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Formato de arquivo */}
          <div className="space-y-2">
            <Label htmlFor="formato">Formato de arquivo</Label>
            <Select
              value={filtros.formato}
              onValueChange={(value) => handleFilterChange("formato", value)}
            >
              <SelectTrigger id="formato">
                <SelectValue placeholder="Selecione um formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="todos-formatos" value="todos">Todos os formatos</SelectItem>
                {formatos.map((formato) => (
                  <SelectItem key={formato} value={formato}>
                    .{formato}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de upload - Início */}
          <div className="space-y-2">
            <Label>Data de upload - Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filtros.dataInicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filtros.dataInicio ? (
                    format(filtros.dataInicio, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filtros.dataInicio}
                  onSelect={(date) => handleFilterChange("dataInicio", date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {filtros.dataInicio && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => handleFilterChange("dataInicio", undefined)}
              >
                <X className="h-3 w-3 mr-1" /> Limpar
              </Button>
            )}
          </div>

          {/* Data de upload - Fim */}
          <div className="space-y-2">
            <Label>Data de upload - Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filtros.dataFim && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filtros.dataFim ? (
                    format(filtros.dataFim, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filtros.dataFim}
                  onSelect={(date) => handleFilterChange("dataFim", date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {filtros.dataFim && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => handleFilterChange("dataFim", undefined)}
              >
                <X className="h-3 w-3 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </div>

        <SheetFooter className="flex flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={limparFiltros}>
            Limpar filtros
          </Button>
          <SheetClose asChild>
            <Button onClick={aplicarFiltros}>Aplicar filtros</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
