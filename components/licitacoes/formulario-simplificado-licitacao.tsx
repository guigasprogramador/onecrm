"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { crmonefactory } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { Upload } from "lucide-react"

interface FormularioSimplificadoLicitacaoProps {
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  titulo: string
  orgao: string
  dataAbertura: string
  responsavel: string
  documentos: File[]
}

export function FormularioSimplificadoLicitacao({ onClose, onSuccess }: FormularioSimplificadoLicitacaoProps) {
  const [formData, setFormData] = useState<FormData>({
    titulo: "",
    orgao: "",
    dataAbertura: "",
    responsavel: "",
    documentos: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Upload dos documentos
      const documentosUrls: string[] = []
      for (const documento of formData.documentos) {
        const fileExt = documento.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `licitacoes/${fileName}`

        const { data: uploadData, error: uploadError } = await crmonefactory.storage
          .from('documentos')
          .upload(filePath, documento)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = crmonefactory.storage
          .from('documentos')
          .getPublicUrl(filePath)

        documentosUrls.push(publicUrl)
      }

      // Criar a licitação
      const { error } = await crmonefactory
        .from('licitacoes')
        .insert([{
          id: uuidv4(),
          titulo: formData.titulo,
          orgao: formData.orgao,
          data_abertura: formData.dataAbertura,
          responsavel: formData.responsavel,
          documentos: documentosUrls,
          status: "analise_interna",
          data_criacao: new Date().toISOString(),
          data_atualizacao: new Date().toISOString()
        }])

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Licitação cadastrada com sucesso"
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao cadastrar licitação:', error)
      toast({
        title: "Erro",
        description: "Erro ao cadastrar licitação",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        documentos: Array.from(e.target.files!)
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="titulo">Nome da Licitação</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="orgao">Órgão Responsável</Label>
        <Input
          id="orgao"
          value={formData.orgao}
          onChange={(e) => setFormData(prev => ({ ...prev, orgao: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="dataAbertura">Data da Licitação</Label>
        <Input
          id="dataAbertura"
          type="date"
          value={formData.dataAbertura}
          onChange={(e) => setFormData(prev => ({ ...prev, dataAbertura: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="responsavel">Responsável</Label>
        <Input
          id="responsavel"
          value={formData.responsavel}
          onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="documentos">Documentos</Label>
        <div className="flex items-center gap-2">
          <Input
            id="documentos"
            type="file"
            multiple
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <Upload className="h-4 w-4 text-gray-500" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  )
} 