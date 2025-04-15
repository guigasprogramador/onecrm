"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, CheckIcon } from "lucide-react"
import { Oportunidade } from "@/types/comercial"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface AgendarReuniaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  oportunidade: Oportunidade
  onReuniaoAgendada?: (reuniao: any) => void
}

export function AgendarReuniao({ 
  open, 
  onOpenChange, 
  oportunidade,
  onReuniaoAgendada
}: AgendarReuniaoProps) {
  // Estado para armazenar a data selecionada
  const [data, setData] = useState<Date | undefined>(addDays(new Date(), 1))
  
  // Estado para armazenar a hora selecionada
  const [hora, setHora] = useState<string>("09:00")
  
  // Estado para armazenar a duração selecionada
  const [duracao, setDuracao] = useState<string>("30")
  
  // Estado para armazenar o local da reunião
  const [local, setLocal] = useState<string>("online")
  
  // Estado para armazenar o link da reunião (se online)
  const [link, setLink] = useState<string>("")
  
  // Estado para armazenar o endereço da reunião (se presencial)
  const [endereco, setEndereco] = useState<string>("")
  
  // Estado para armazenar a pauta da reunião
  const [pauta, setPauta] = useState<string>("")
  
  // Estado para armazenar os participantes da reunião
  const [participantes, setParticipantes] = useState<string>(oportunidade.responsavel)
  
  // Função para lidar com o agendamento da reunião
  const handleAgendar = () => {
    // Validação dos campos
    if (!data) {
      toast({
        title: "Erro",
        description: "Selecione uma data para a reunião",
        variant: "destructive",
      })
      return
    }
    
    // Construir objeto de reunião
    const reuniao = {
      oportunidadeId: oportunidade.id,
      titulo: `Reunião - ${oportunidade.titulo}`,
      data: format(data, "yyyy-MM-dd"),
      hora,
      duracao: parseInt(duracao),
      local,
      link: local === "online" ? link : null,
      endereco: local === "presencial" ? endereco : null,
      pauta,
      participantes: participantes.split(",").map(p => p.trim()),
      cliente: oportunidade.cliente,
      clienteId: oportunidade.clienteId,
      status: "agendada",
      createdAt: new Date().toISOString()
    }
    
    // Aqui você faria a chamada para a API para agendar a reunião
    // Por exemplo: await api.post("/api/comercial/reunioes", reuniao)
    
    // Para demonstração, vamos apenas simular o sucesso e fechar o modal
    console.log("Reunião agendada:", reuniao)
    
    // Chamar callback se fornecido
    if (onReuniaoAgendada) {
      onReuniaoAgendada(reuniao)
    }
    
    // Mostrar notificação de sucesso
    toast({
      title: "Reunião agendada",
      description: `Reunião agendada para ${format(data, "PPP", { locale: ptBR })} às ${hora}`,
    })
    
    // Fechar o modal
    onOpenChange(false)
    
    // Limpar os campos
    setData(addDays(new Date(), 1))
    setHora("09:00")
    setDuracao("30")
    setLocal("online")
    setLink("")
    setEndereco("")
    setPauta("")
    setParticipantes(oportunidade.responsavel)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Agendar Reunião</DialogTitle>
          <DialogDescription>
            {`Agende uma reunião para a oportunidade "${oportunidade.titulo}" com ${oportunidade.cliente}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data}
                    onSelect={setData}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <div>
                <Label htmlFor="hora">Horário</Label>
                <Input 
                  type="time"
                  id="hora"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
              
              <div className="mt-4">
                <Label htmlFor="duracao">Duração (minutos)</Label>
                <Select value={duracao} onValueChange={setDuracao}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="local">Local</Label>
                <Select value={local} onValueChange={setLocal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {local === "online" || local === "hibrido" ? (
                <div className="mt-4">
                  <Label htmlFor="link">Link da reunião</Label>
                  <Input 
                    id="link"
                    placeholder="https://meet.google.com/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
              ) : null}
              
              {local === "presencial" || local === "hibrido" ? (
                <div className="mt-4">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input 
                    id="endereco"
                    placeholder="Rua, número, complemento..."
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="participantes">Participantes</Label>
            <Input 
              id="participantes"
              placeholder="Nomes separados por vírgula"
              value={participantes}
              onChange={(e) => setParticipantes(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pauta">Pauta da reunião</Label>
            <Textarea 
              id="pauta"
              placeholder="Detalhe os tópicos a serem discutidos..."
              value={pauta}
              onChange={(e) => setPauta(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAgendar}>
            <CheckIcon className="mr-2 h-4 w-4" />
            Agendar Reunião
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
